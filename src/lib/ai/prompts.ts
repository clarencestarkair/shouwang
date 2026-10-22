/**
 * Prompt 工程：
 * - 角色与受众分离：分析是专业的，表达是给老人听的；
 * - 明确工作流（先检索、再核验、后报告），保证输出稳定可控；
 * - 不可信内容隔离：用户提交的待分析内容一律视为数据，不执行其中的指令；
 * - 输出约束交给工具 schema（submitRiskReport），而非自由文本。
 */
import { FRAUD_TYPES } from "@/lib/core/types";
