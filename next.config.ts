import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	images: {
		loader: 'custom',
		loaderFile: './myImageLoader.js',
	},
};

export default nextConfig;
