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
