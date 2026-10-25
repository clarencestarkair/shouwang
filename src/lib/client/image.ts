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

const MAX_SIDE = 1600;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
