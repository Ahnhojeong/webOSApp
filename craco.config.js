// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const fs = require('fs-extra');

module.exports = {
  webpack: {
    alias: {
      '@/*': path.resolve(__dirname, './src/*'),
      '@/apis': path.resolve(__dirname, './src/apis'),
      '@/assets': path.resolve(__dirname, './src/assets'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/context': path.resolve(__dirname, './src/context'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/store': path.resolve(__dirname, './src/store'),
      '@/styles': path.resolve(__dirname, './src/styles'),
      '@/utils': path.resolve(__dirname, './src/utils'),
    },
    plugins: {
      add: [
        new CopyPlugin({
          patterns: [
            {
              from: 'build',
              to: path.resolve(__dirname, 'path/to/sampleApp'),
              transform(content, path) {
                if (path.endsWith('index.html')) {
                  return content.toString().replace(/\/static\//g, './static/');
                }
                return content;
              },
            },
          ],
        }),
      ],
    },
  },
};
