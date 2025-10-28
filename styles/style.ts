import { IconAsk } from "~components/helpers/icons"

// ~styles/style.ts
export const menuWrapperStyle = `
  position: absolute;
  z-index: 1000000;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  user-select: none;
`

export const iconStyle = `
  color: white;
  font-size: 16px;
  cursor: pointer;
  border-radius: 999px;
  padding: 8px 10px;
  background: linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%);
  box-shadow: 0 6px 18px rgba(12,12,20,0.35);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 150ms ease, box-shadow 150ms ease;
`

export const iconHoverStyle = `
  transform: scale(1.12);
  box-shadow: 0 10px 26px rgba(12,12,20,0.45);
`

// Responsive popup: width uses 90% up to max-width; max-height bounds it
export const popupStyle = `
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000100;
  width: 90%;
  max-width: 720px;
  border-radius: 14px;
  background: #0b0b0d;
  color: #ffffff;
  box-shadow: 0 26px 80px rgba(2,6,23,0.8);
  padding: 14px;
  -webkit-user-select: text;
  user-select: text;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  max-height: 80vh;
  overflow: hidden;
  min-height: 320px;
  popup.style.transform = "translateZ(0)" // create a stacking context for the popup
  popup.style.willChange = "transform"
`

export const popupHeaderStyle = `
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: grab;
`

export const popupTitleStyle = `
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  margin: 0;
  padding: 0;
`

// textarea grows to fill available vertical space
export const popupTextarea = `
  width: 100%;
  flex: 1 1 auto;
  min-height: 180px;
  border-radius: 10px;
  padding: 12px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  color: #ffffff;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  outline: none;
`

export const popupButtonsRow = `
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
`

export const actionButtonBase = `
  flex: 1 1 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  border: none;
  cursor: pointer;
  transition: transform 140ms ease, box-shadow 140ms ease, opacity 120ms ease;
  box-shadow: 0 8px 26px rgba(0,0,0,0.45);
  min-width: 0;
`

export const actionButtonGradient = `
  background: linear-gradient(90deg, rgba(59,130,246,1) 0%, rgba(99,102,241,1) 50%, rgba(139,92,246,1) 100%);
`

export const actionButtonGradient2 = `
  background: linear-gradient(90deg, rgba(16,185,129,1) 0%, rgba(6,182,212,1) 100%);
`

export const actionButtonHover = `
  transform: translateY(-3px);
  box-shadow: 0 14px 36px rgba(0,0,0,0.6);
`

export const closeBtnStyle = `
  background: transparent;
  border: 1px solid rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.9);
  padding: 8px 10px;
  border-radius: 9px;
  cursor: pointer;
  font-weight: 700;
`

export const copyBtnStyle = `
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.04);
  color: #fff;
  padding: 8px 10px;
  border-radius: 9px;
  cursor: pointer;
  font-weight: 700;
`
// ~styles/style.ts

// --- Icon Styles ---
export const floatingIconBaseStyle = `
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
  border: 2px solid white;
  pointer-events: auto;
  user-select: none;
`

export const floatingIconHoverStyle = `
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  transform: scale(1.1);
`

// --- Animation/Global Styles (Move to a dedicated style file) ---

// Keyframes
export const pulseKeyframes = `
  @keyframes insightlens-pulse {
    0% { transform: scale(1); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
    50% { transform: scale(1.05); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4); }
    100% { transform: scale(1); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
  }
`

export const spinnerKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

      /* Custom scrollbar for textarea */
    #insightlens-popup textarea {
      scrollbar-width: thin;
      scrollbar-color: #c1c1c1 #f5f5f5;
    }
    
    #insightlens-popup textarea::-webkit-scrollbar {
      width: 12px;
    }
    
    #insightlens-popup textarea::-webkit-scrollbar-track {
      background: #f5f5f5;
      border-radius: 6px;
    }
    
    #insightlens-popup textarea::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 6px;
      border: 2px solid #f5f5f5;
    }
    
    #insightlens-popup textarea::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
    
    #insightlens-popup textarea::-webkit-scrollbar-corner {
      background: #f5f5f5;
    }
    
    /* Smooth scrolling */
    #insightlens-popup textarea {
      scroll-behavior: smooth;
    }
`

export const globalStylesString = `
  #insightlens-menu {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    z-index: 1000000;
    pointer-events: none;
  }
  
  #insightlens-menu > div {
    pointer-events: auto;
  }
  
  #insightlens-popup {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    z-index: 1000001;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  
  /* Ensure it works on dark mode websites */
  #insightlens-popup textarea {
    background: white;
    color: black;
  }
  
  @media (prefers-color-scheme: dark) {
    #insightlens-popup textarea {
      background: #1e1e1e;
      color: #ffffff;
    }
  }
  
  /* Prevent interference with website styles */
  #insightlens-menu *,
  #insightlens-popup * {
    box-sizing: border-box;
    line-height: normal;
  }

  /* Custom scrollbar for textarea */
  #insightlens-popup textarea {
    scrollbar-width: thin;
    scrollbar-color: #c1c1c1 #f5f5f5;
    scroll-behavior: smooth; /* Moved from component */
  }
  
  #insightlens-popup textarea::-webkit-scrollbar {
    width: 12px;
  }
  
  #insightlens-popup textarea::-webkit-scrollbar-track {
    background: #f5f5f5;
    border-radius: 6px;
  }
  
  #insightlens-popup textarea::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 6px;
    border: 2px solid #f5f5f5;
  }
  
  #insightlens-popup textarea::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
  
  #insightlens-popup textarea::-webkit-scrollbar-corner {
    background: #f5f5f5;
  }
`

export const askInputStyle = `
    flex: 4;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.15);
    font-size: 13px;
    background-color: #0f0f0f;
    color: #fff;
    outline: none;
`
export const loaderButtonStyle = `
    <div style="display:flex;align-items:center;gap:6px;">
      <div class="spinner" style="width:12px;height:12px;border:2px solid transparent;border-top:2px solid currentColor;border-radius:50%;animation:spin 1s linear infinite"></div>
      <span style="font-weight:600;font-size:13px">Processing...</span>
    </div>`

export const rowStyle = `
      margin-top: 10px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    `
export const separatorStyle = `
    text-align: center;
    color: #6b7280;
    margin: 4px 0;
    font-style: italic;
    user-select: none;
    opacity: 0.5;
    font-size: 11px;
  `
export const separatorStyle2 = `
      text-align: center;
      color: #6b7280;
      margin: 4px 0;
      font-style: italic;
      user-select: none;
      opacity: 0.5;
      font-size: 11px;
    `
export const textareaStyles = `     height: 300px;     min-height: 300px;     max-height: calc(60vh - 80px);     resize: vertical;     overflow: auto;     white-space: pre-wrap;     font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;     font-size: 13px;     line-height: 1.4;     padding: 12px;   `

export const cancelStyle = `
      flex: 1;
      padding: 8px 10px;
      font-weight: 600;
      color: #fff;
      ${actionButtonBase + actionButtonGradient}
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 13px;
      opacity: 0.9;
    `

export const askButton = `<div style="display:flex;align-items:center;gap:6px">${IconAsk}<span style="font-weight:600;font-size:13px">Ask AI</span></div>`

export const inputStyle = `
      margin-top: 10px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    `

export const sendButtonStyle = `
      flex: 1;
      padding: 8px 10px;
      font-weight: 600;
      color: #fff;
      ${actionButtonBase + actionButtonGradient2}
    `
// Update global styles to include color coding and section styling
export const enhancedGlobalStyles = `   ${globalStylesString}      /* Color coding for different text types */   .code-section {     padding: 6px 10px;     margin: 2px 0;     border-radius: 4px;     white-space: pre-wrap;     font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;     font-size: 13px;     line-height: 1.4;     min-height: 20px;     outline: none;     transition: all 0.2s ease;   }      /* Subtle focus outline */   .code-section:focus {     outline: 1px solid rgba(59, 130, 246, 0.5);     outline-offset: 1px;   }      .code-section.user-code {     color: #e5e7eb;     background: rgba(59, 130, 246, 0.08);     border-left: 2px solid #3b82f6;   }      .code-section.ai-response {   color: #10b981;   background: rgba(16, 185, 129, 0.06); /* less opacity if you want */   border-left: 2px solid #10b981;   padding: 4px 8px; /* smaller padding */   margin-bottom: 2px; }    .code-section.error {     color: #ef4444;     background: rgba(239, 68, 68, 0.08);     border-left: 2px solid #ef4444;   }      .code-section.user-question {     color: #f59e0b;     background: rgba(245, 158, 11, 0.08);     border-left: 2px solid #f59e0b;     font-style: italic;   }      .section-separator {     text-align: center;     color: #6b7280;     margin: 4px 0;     font-style: italic;     user-select: none;     opacity: 0.5;     font-size: 11px;   } `

export const globalStyleText = `
      #insightlens-menu, #insightlens-popup {         font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;         z-index: 1000000;       }        #insightlens-popup {         backdrop-filter: blur(10px);         -webkit-backdrop-filter: blur(10px);       }     `
