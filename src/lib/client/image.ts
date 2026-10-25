/**
 * 端侧图像预处理（浏览器内完成，不上传原图）：
 * 1. 压缩到长边 ≤1600px，降低上传体积与视觉模型 token 消耗；
 * 2. 用 jsQR 在本机解码二维码——诈骗传单/截图里常藏有二维码链接，
 *    视觉大模型无法“扫码”，端侧解码可补上这一环。
 * jsQR 按需动态加载，不计入首屏体积。
 */

export interface PreparedImage {
  dataUrl: string;
  mediaType: string;
  name: string;
  qr: string | null;
  width: number;
  height: number;
}
