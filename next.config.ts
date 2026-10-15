import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 生成独立运行包，便于 Docker / 云服务器部署
  output: "standalone",
  // 预计算的向量索引在运行时通过 fs 读取，需显式打包进服务端产物
  outputFileTracingIncludes: {
    "/api/**": ["./data/embeddings.json"],
  },
  poweredByHeader: false,
  // 录制演示视频时不显示开发角标
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // 长辈端需要麦克风（语音输入）
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
        ],
      },
    ];
  },
};
