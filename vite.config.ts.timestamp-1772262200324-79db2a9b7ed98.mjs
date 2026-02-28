// vite.config.ts
import { defineConfig, loadEnv } from "file:///D:/Projects/NovaBlog/node_modules/vite/dist/node/index.js";
import vue from "file:///D:/Projects/NovaBlog/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import path from "path";
import Inspector from "file:///D:/Projects/NovaBlog/node_modules/unplugin-vue-dev-locator/dist/vite.mjs";
var __vite_injected_original_dirname = "D:\\Projects\\NovaBlog";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiUrl = env.VITE_API_URL || "http://localhost:3001";
  const basePath = env.VITE_BASE_PATH || "/";
  const apiBase = env.VITE_API_BASE || "/api";
  const isProduction = mode === "production";
  return {
    build: {
      sourcemap: "hidden",
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes("node_modules")) {
              if (id.includes("vue") || id.includes("pinia") || id.includes("vue-router") || id.includes("vue-i18n")) {
                return "vendor";
              }
              if (id.includes("ant-design-vue") || id.includes("lucide-vue-next")) {
                return "ui";
              }
              if (id.includes("markdown-it") || id.includes("highlight.js")) {
                return "markdown";
              }
              if (id.includes("mermaid")) {
                return "mermaid";
              }
            }
          }
        }
      }
    },
    base: basePath,
    define: {
      "import.meta.env.VITE_API_BASE": JSON.stringify(apiBase),
      "import.meta.env.VITE_API_URL": JSON.stringify(
        isProduction ? "" : apiUrl
      )
    },
    plugins: [vue(), Inspector()],
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    server: {
      proxy: {
        "/api": {
          target: apiUrl,
          changeOrigin: true,
          secure: false
        },
        "/uploads": {
          target: apiUrl,
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxQcm9qZWN0c1xcXFxOb3ZhQmxvZ1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcUHJvamVjdHNcXFxcTm92YUJsb2dcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L1Byb2plY3RzL05vdmFCbG9nL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSBcInZpdGVcIlxyXG5pbXBvcnQgdnVlIGZyb20gXCJAdml0ZWpzL3BsdWdpbi12dWVcIlxyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiXHJcbmltcG9ydCBJbnNwZWN0b3IgZnJvbSBcInVucGx1Z2luLXZ1ZS1kZXYtbG9jYXRvci92aXRlXCJcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcclxuXHRjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCksIFwiXCIpXHJcblx0Y29uc3QgYXBpVXJsID0gZW52LlZJVEVfQVBJX1VSTCB8fCBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMVwiXHJcblx0Y29uc3QgYmFzZVBhdGggPSBlbnYuVklURV9CQVNFX1BBVEggfHwgXCIvXCJcclxuXHRjb25zdCBhcGlCYXNlID0gZW52LlZJVEVfQVBJX0JBU0UgfHwgXCIvYXBpXCJcclxuXHRjb25zdCBpc1Byb2R1Y3Rpb24gPSBtb2RlID09PSBcInByb2R1Y3Rpb25cIlxyXG5cclxuXHRyZXR1cm4ge1xyXG5cdFx0YnVpbGQ6IHtcclxuXHRcdFx0c291cmNlbWFwOiBcImhpZGRlblwiLFxyXG5cdFx0XHRyb2xsdXBPcHRpb25zOiB7XHJcblx0XHRcdFx0b3V0cHV0OiB7XHJcblx0XHRcdFx0XHRtYW51YWxDaHVua3M6IChpZCkgPT4ge1xyXG5cdFx0XHRcdFx0XHRpZiAoaWQuaW5jbHVkZXMoXCJub2RlX21vZHVsZXNcIikpIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAoXHJcblx0XHRcdFx0XHRcdFx0XHRpZC5pbmNsdWRlcyhcInZ1ZVwiKSB8fFxyXG5cdFx0XHRcdFx0XHRcdFx0aWQuaW5jbHVkZXMoXCJwaW5pYVwiKSB8fFxyXG5cdFx0XHRcdFx0XHRcdFx0aWQuaW5jbHVkZXMoXCJ2dWUtcm91dGVyXCIpIHx8XHJcblx0XHRcdFx0XHRcdFx0XHRpZC5pbmNsdWRlcyhcInZ1ZS1pMThuXCIpXHJcblx0XHRcdFx0XHRcdFx0KSB7XHJcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gXCJ2ZW5kb3JcIlxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRpZiAoXHJcblx0XHRcdFx0XHRcdFx0XHRpZC5pbmNsdWRlcyhcImFudC1kZXNpZ24tdnVlXCIpIHx8XHJcblx0XHRcdFx0XHRcdFx0XHRpZC5pbmNsdWRlcyhcImx1Y2lkZS12dWUtbmV4dFwiKVxyXG5cdFx0XHRcdFx0XHRcdCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIFwidWlcIlxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRpZiAoaWQuaW5jbHVkZXMoXCJtYXJrZG93bi1pdFwiKSB8fCBpZC5pbmNsdWRlcyhcImhpZ2hsaWdodC5qc1wiKSkge1xyXG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIFwibWFya2Rvd25cIlxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRpZiAoaWQuaW5jbHVkZXMoXCJtZXJtYWlkXCIpKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gXCJtZXJtYWlkXCJcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0fSxcclxuXHRcdH0sXHJcblx0XHRiYXNlOiBiYXNlUGF0aCxcclxuXHRcdGRlZmluZToge1xyXG5cdFx0XHRcImltcG9ydC5tZXRhLmVudi5WSVRFX0FQSV9CQVNFXCI6IEpTT04uc3RyaW5naWZ5KGFwaUJhc2UpLFxyXG5cdFx0XHRcImltcG9ydC5tZXRhLmVudi5WSVRFX0FQSV9VUkxcIjogSlNPTi5zdHJpbmdpZnkoXHJcblx0XHRcdFx0aXNQcm9kdWN0aW9uID8gXCJcIiA6IGFwaVVybCxcclxuXHRcdFx0KSxcclxuXHRcdH0sXHJcblx0XHRwbHVnaW5zOiBbdnVlKCksIEluc3BlY3RvcigpXSxcclxuXHRcdHJlc29sdmU6IHtcclxuXHRcdFx0YWxpYXM6IHtcclxuXHRcdFx0XHRcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuXHRcdFx0fSxcclxuXHRcdH0sXHJcblx0XHRzZXJ2ZXI6IHtcclxuXHRcdFx0cHJveHk6IHtcclxuXHRcdFx0XHRcIi9hcGlcIjoge1xyXG5cdFx0XHRcdFx0dGFyZ2V0OiBhcGlVcmwsXHJcblx0XHRcdFx0XHRjaGFuZ2VPcmlnaW46IHRydWUsXHJcblx0XHRcdFx0XHRzZWN1cmU6IGZhbHNlLFxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0XCIvdXBsb2Fkc1wiOiB7XHJcblx0XHRcdFx0XHR0YXJnZXQ6IGFwaVVybCxcclxuXHRcdFx0XHRcdGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuXHRcdFx0XHRcdHNlY3VyZTogZmFsc2UsXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0fSxcclxuXHRcdH0sXHJcblx0fVxyXG59KVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW9QLFNBQVMsY0FBYyxlQUFlO0FBQzFSLE9BQU8sU0FBUztBQUNoQixPQUFPLFVBQVU7QUFDakIsT0FBTyxlQUFlO0FBSHRCLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ3pDLFFBQU0sTUFBTSxRQUFRLE1BQU0sUUFBUSxJQUFJLEdBQUcsRUFBRTtBQUMzQyxRQUFNLFNBQVMsSUFBSSxnQkFBZ0I7QUFDbkMsUUFBTSxXQUFXLElBQUksa0JBQWtCO0FBQ3ZDLFFBQU0sVUFBVSxJQUFJLGlCQUFpQjtBQUNyQyxRQUFNLGVBQWUsU0FBUztBQUU5QixTQUFPO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDTixXQUFXO0FBQUEsTUFDWCxlQUFlO0FBQUEsUUFDZCxRQUFRO0FBQUEsVUFDUCxjQUFjLENBQUMsT0FBTztBQUNyQixnQkFBSSxHQUFHLFNBQVMsY0FBYyxHQUFHO0FBQ2hDLGtCQUNDLEdBQUcsU0FBUyxLQUFLLEtBQ2pCLEdBQUcsU0FBUyxPQUFPLEtBQ25CLEdBQUcsU0FBUyxZQUFZLEtBQ3hCLEdBQUcsU0FBUyxVQUFVLEdBQ3JCO0FBQ0QsdUJBQU87QUFBQSxjQUNSO0FBQ0Esa0JBQ0MsR0FBRyxTQUFTLGdCQUFnQixLQUM1QixHQUFHLFNBQVMsaUJBQWlCLEdBQzVCO0FBQ0QsdUJBQU87QUFBQSxjQUNSO0FBQ0Esa0JBQUksR0FBRyxTQUFTLGFBQWEsS0FBSyxHQUFHLFNBQVMsY0FBYyxHQUFHO0FBQzlELHVCQUFPO0FBQUEsY0FDUjtBQUNBLGtCQUFJLEdBQUcsU0FBUyxTQUFTLEdBQUc7QUFDM0IsdUJBQU87QUFBQSxjQUNSO0FBQUEsWUFDRDtBQUFBLFVBQ0Q7QUFBQSxRQUNEO0FBQUEsTUFDRDtBQUFBLElBQ0Q7QUFBQSxJQUNBLE1BQU07QUFBQSxJQUNOLFFBQVE7QUFBQSxNQUNQLGlDQUFpQyxLQUFLLFVBQVUsT0FBTztBQUFBLE1BQ3ZELGdDQUFnQyxLQUFLO0FBQUEsUUFDcEMsZUFBZSxLQUFLO0FBQUEsTUFDckI7QUFBQSxJQUNEO0FBQUEsSUFDQSxTQUFTLENBQUMsSUFBSSxHQUFHLFVBQVUsQ0FBQztBQUFBLElBQzVCLFNBQVM7QUFBQSxNQUNSLE9BQU87QUFBQSxRQUNOLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxNQUNyQztBQUFBLElBQ0Q7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNOLFFBQVE7QUFBQSxVQUNQLFFBQVE7QUFBQSxVQUNSLGNBQWM7QUFBQSxVQUNkLFFBQVE7QUFBQSxRQUNUO0FBQUEsUUFDQSxZQUFZO0FBQUEsVUFDWCxRQUFRO0FBQUEsVUFDUixjQUFjO0FBQUEsVUFDZCxRQUFRO0FBQUEsUUFDVDtBQUFBLE1BQ0Q7QUFBQSxJQUNEO0FBQUEsRUFDRDtBQUNELENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
