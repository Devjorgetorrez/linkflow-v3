/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  // O painel é a área administrativa do cliente — nunca pode ser indexado.
  // robots.txt sozinho não tira página do índice (o próprio Google diz que
  // quem faz isso é o noindex); por isso o header, em toda rota.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
