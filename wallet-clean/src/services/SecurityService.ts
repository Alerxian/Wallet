/**
 * 安全服务（轻量版）
 * - URL 风险评估
 * - 签名/交易请求的基本可读化与风险提示
 *
 * 注意：这是可用化的第一步，后续可接入真实的 phishing feed / 标签库 / 交易模拟。
 */

import { ethers } from 'ethers';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface RiskFinding {
  level: RiskLevel;
  title: string;
  detail?: string;
}

export interface RiskReport {
  level: RiskLevel;
  findings: RiskFinding[];
}

const HIGH_RISK_HOST_KEYWORDS = [
  'drainer',
  'airdrop-claim',
  'wallet-verify',
  'claim-airdrop',
  'verify-wallet',
  'support-restore',
  'seed',
  'mnemonic',
];

const SHORTENER_HOSTS = [
  'bit.ly',
  't.co',
  'tinyurl.com',
  'goo.gl',
  'rebrand.ly',
  'is.gd',
  'cutt.ly',
];

function maxLevel(levels: RiskLevel[]): RiskLevel {
  if (levels.includes('high')) return 'high';
  if (levels.includes('medium')) return 'medium';
  return 'low';
}

export class SecurityService {
  private static decodeTxData(data: string): { action: string; warning?: string } {
    if (!data || data === '0x') {
      return { action: '原生转账/无合约调用' };
    }

    const sig = data.slice(0, 10).toLowerCase();
    if (sig === '0x095ea7b3') {
      return {
        action: 'ERC20 approve 授权',
        warning: '该操作可能授予代币使用权限，请确认 spender 是否可信。',
      };
    }
    if (sig === '0xa22cb465') {
      return {
        action: 'setApprovalForAll 授权',
        warning: '该操作可能授予 NFT 全量管理权限。',
      };
    }
    if (sig === '0x23b872dd') {
      return {
        action: 'transferFrom 调用',
        warning: '通常用于第三方代扣或授权后的转账。',
      };
    }
    if (sig === '0x38ed1739' || sig === '0x18cbafe5' || sig === '0x7ff36ab5') {
      return { action: 'DEX 兑换相关调用' };
    }

    return {
      action: `未知合约调用 (${sig})`,
      warning: '未识别的方法签名，建议谨慎确认目标站点与合约。',
    };
  }

  static assessUrl(rawUrl: string): RiskReport {
    const findings: RiskFinding[] = [];

    const url = rawUrl.trim();
    if (!url) {
      return { level: 'medium', findings: [{ level: 'medium', title: 'URL 为空' }] };
    }

    const normalized = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;

    let parsed: URL | null = null;
    try {
      parsed = new URL(normalized);
    } catch {
      return { level: 'high', findings: [{ level: 'high', title: 'URL 格式无效' }] };
    }

    const protocol = parsed.protocol.toLowerCase();
    const host = parsed.host.toLowerCase();

    if (protocol !== 'https:' && protocol !== 'http:') {
      findings.push({
        level: 'high',
        title: '非 http(s) 协议',
        detail: `检测到协议 ${protocol}，已视为高风险。`,
      });
    }

    if (protocol === 'http:') {
      findings.push({
        level: 'medium',
        title: '非 HTTPS 链接',
        detail: 'HTTP 存在中间人风险，建议仅访问 HTTPS。',
      });
    }

    if (host.includes('xn--')) {
      findings.push({
        level: 'medium',
        title: '疑似同形异义域名（Punycode）',
        detail: '该域名包含 xn--，可能用于仿冒域名。',
      });
    }

    if (SHORTENER_HOSTS.includes(host)) {
      findings.push({
        level: 'medium',
        title: '短链接跳转',
        detail: '短链接可能隐藏真实目标站点。',
      });
    }

    const keywordHit = HIGH_RISK_HOST_KEYWORDS.find((k) => host.includes(k));
    if (keywordHit) {
      findings.push({
        level: 'high',
        title: '域名命中高风险关键词',
        detail: `命中关键词: ${keywordHit}`,
      });
    }

    const level = maxLevel(findings.map((f) => f.level));
    return { level, findings };
  }

  static summarizeWalletConnectRequest(req: {
    method: string;
    params: any[];
    chainId?: string;
  }): { title: string; lines: string[]; risk: RiskReport } {
    const { method, params, chainId } = req;
    const lines: string[] = [];
    const findings: RiskFinding[] = [];

    lines.push(`Method: ${method}`);
    if (chainId) lines.push(`Chain: ${chainId}`);

    if (method === 'eth_sendTransaction') {
      const tx = params?.[0] || {};
      const to = String(tx?.to || '');
      const valueHex = tx?.value;
      const data = String(tx?.data || '');

      if (to) lines.push(`To: ${to}`);
      if (valueHex) {
        try {
          const valueWei = BigInt(valueHex);
          lines.push(`Value: ${ethers.formatEther(valueWei)} native`);
        } catch {
          lines.push(`Value: ${String(valueHex)}`);
        }
      }

      if (data && data !== '0x') {
        const decoded = this.decodeTxData(data);
        lines.push(`Action: ${decoded.action}`);
        lines.push(`Data: ${data.slice(0, 18)}... (${Math.max(0, data.length - 2) / 2} bytes)`);
        findings.push({
          level: 'medium',
          title: '合约交互交易',
          detail: '该交易包含 data 字段，可能是授权/兑换/合约调用。请确认目标合约与预期一致。',
        });

        if (decoded.warning) {
          findings.push({
            level: 'high',
            title: decoded.action,
            detail: decoded.warning,
          });
        }
      }

      if (!to) {
        findings.push({ level: 'high', title: '交易缺少 to 地址' });
      }
    } else if (method === 'personal_sign' || method === 'eth_sign') {
      findings.push({
        level: 'medium',
        title: '消息签名',
        detail: '签名可能用于登录或授权。请确认 dApp 域名可信。',
      });
    } else if (method === 'eth_signTypedData' || method === 'eth_signTypedData_v4') {
      findings.push({
        level: 'medium',
        title: '结构化签名（Typed Data）',
        detail: 'Typed Data 签名可被用于授权。务必检查 domain 与关键字段。',
      });
    } else {
      findings.push({ level: 'medium', title: '未知/未审计方法', detail: '该方法未在钱包内做安全解释。' });
    }

    const risk: RiskReport = {
      level: maxLevel(findings.map((f) => f.level)),
      findings,
    };

    return {
      title: 'dApp 请求',
      lines,
      risk,
    };
  }
}
