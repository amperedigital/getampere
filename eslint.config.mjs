
import globals from "globals";
import js from "@eslint/js";

export default [
    {
        ignores: ["deploy/assets/js/unicornStudio.umd.js"]
    },
    js.configs.recommended,
    {
        files: ["deploy/**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.node,
                // Custom Globals
                createDistortionGrid: "readonly",
                createHeroSlider: "readonly",
                createParticles: "readonly",
                createLogoLoader: "readonly",
                createScrollSpy: "readonly",
                createNavbar: "readonly",
                createVideoManager: "readonly",
                Lenis: "readonly",
                gsap: "readonly",
                ScrollTrigger: "readonly",
                THREE: "readonly",
                AmpereAIChat: "readonly",
                SystemLink: "readonly",
                echarts: "readonly",
                Chart: "readonly",
                UnicornStudio: "readonly",
                // Common aliases often used
                window: "readonly",
                document: "readonly",
                console: "readonly"
            }
        },
        rules: {
            "no-undef": "error",
            "no-unused-vars": ["warn", { "vars": "all", "args": "none", "ignoreRestSiblings": false }],
            "no-empty": "warn",
            "no-global-assign": "warn",
            "no-redeclare": "warn",
            "no-useless-assignment": "warn",
            "no-unreachable": "warn"
        }
    }
];
