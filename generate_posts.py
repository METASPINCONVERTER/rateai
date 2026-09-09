import os
import base64
from playwright.sync_api import sync_playwright

IMAGE_DIR = "/tmp/file_attachments/pc-remote-website (1)/images"

def get_base64_image(filename):
    filepath = os.path.join(IMAGE_DIR, filename)
    if not os.path.exists(filepath):
        return ""
    ext = os.path.splitext(filename)[1].lower()
    mime = "image/png"
    if ext in [".jpg", ".jpeg"]:
        mime = "image/jpeg"
    elif ext == ".svg":
        mime = "image/svg+xml"
    with open(filepath, "rb") as f:
        data = base64.b64encode(f.read()).decode("utf-8")
    return f"data:{mime};base64,{data}"

hero_img = get_base64_image("pcpilot-hero.jpg")
touchpad_img = get_base64_image("screen-touchpad.png")
keyboard_img = get_base64_image("screen-keyboard.png")
health_img = get_base64_image("screen-health.png")
power_img = get_base64_image("screen-power.png")
icon_img = get_base64_image("pcpilot-icon-512.png")

BASE_CSS = """
@import url('https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@700,800,900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800;900&family=JetBrains+Mono:wght@700;800&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
    width: 1080px;
    height: 1080px;
    overflow: hidden;
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #090514;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 50px 60px;
    position: relative;
}

.mono { font-family: 'JetBrains Mono', monospace; }
.cabinet { font-family: 'Cabinet Grotesk', sans-serif; }

/* Dynamic Background Glows */
.glow-primary {
    position: absolute;
    width: 750px;
    height: 750px;
    background: radial-gradient(circle, rgba(168, 85, 247, 0.5) 0%, rgba(124, 58, 237, 0.2) 50%, transparent 75%);
    top: -150px;
    right: -150px;
    border-radius: 50%;
    filter: blur(70px);
    z-index: 0;
}

.glow-secondary {
    position: absolute;
    width: 650px;
    height: 650px;
    background: radial-gradient(circle, rgba(124, 58, 237, 0.45) 0%, rgba(76, 29, 149, 0.15) 55%, transparent 80%);
    bottom: -150px;
    left: -150px;
    border-radius: 50%;
    filter: blur(70px);
    z-index: 0;
}

.ad-grid {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image: linear-gradient(rgba(192, 132, 252, 0.08) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(192, 132, 252, 0.08) 1px, transparent 1px);
    background-size: 50px 50px;
    z-index: 0;
}

/* Ad Header Bar */
.ad-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 10;
}

.ad-brand {
    display: flex;
    align-items: center;
    gap: 16px;
    background: rgba(255, 255, 255, 0.06);
    padding: 10px 24px 10px 14px;
    border-radius: 999px;
    border: 1px solid rgba(192, 132, 252, 0.3);
    backdrop-filter: blur(16px);
}

.ad-brand-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(168, 85, 247, 0.5);
}

.ad-brand-name {
    font-size: 28px;
    font-weight: 900;
    letter-spacing: -0.5px;
    color: #ffffff;
}

.ad-brand-name span { color: #c084fc; }

.ad-badge {
    background: linear-gradient(135deg, #a855f7, #7c3aed);
    color: #ffffff;
    padding: 10px 24px;
    border-radius: 999px;
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 0.8px;
    box-shadow: 0 8px 20px rgba(168, 85, 247, 0.4);
    text-transform: uppercase;
}

/* Floating Ad Sticker / Badge */
.sticker {
    position: absolute;
    background: #facc15;
    color: #0d0819;
    padding: 8px 18px;
    border-radius: 12px;
    font-weight: 900;
    font-size: 16px;
    transform: rotate(-4deg);
    box-shadow: 0 10px 25px rgba(250, 204, 21, 0.4);
    z-index: 20;
}

/* Glass Frame */
.glass-box {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(192, 132, 252, 0.3);
    border-radius: 28px;
    backdrop-filter: blur(20px);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

/* Ad Footer Banner */
.ad-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 10;
    background: linear-gradient(90deg, rgba(124, 58, 237, 0.25), rgba(168, 85, 247, 0.15));
    border: 1.5px solid rgba(192, 132, 252, 0.4);
    padding: 18px 32px;
    border-radius: 999px;
    backdrop-filter: blur(20px);
}

.ad-url {
    font-size: 24px;
    font-weight: 800;
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: 10px;
}

.ad-cta-btn {
    background: linear-gradient(135deg, #c084fc, #7c3aed);
    color: #ffffff;
    font-size: 20px;
    font-weight: 900;
    padding: 14px 36px;
    border-radius: 999px;
    box-shadow: 0 10px 30px rgba(192, 132, 252, 0.5);
    display: flex;
    align-items: center;
    gap: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
"""

POSTS = [
    # 1. Main High Impact AD
    {
        "id": "post_01_hero",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head><style>{BASE_CSS}</style></head>
        <body>
            <div class="ad-grid"></div>
            <div class="glow-primary"></div>
            <div class="glow-secondary"></div>

            <div class="ad-header">
                <div class="ad-brand">
                    <img src="{icon_img}" class="ad-brand-icon" />
                    <div class="ad-brand-name cabinet">PC<span>Pilot</span></div>
                </div>
                <div class="ad-badge mono">🚀 TOP REMOTE APP 2026</div>
            </div>

            <div style="z-index: 10; text-align: center; margin: 20px 0; position: relative;">
                <div class="sticker" style="top: -15px; left: 120px;">⚡ ZERO CLOUD · 100% PRIVATE</div>
                <h1 class="cabinet" style="font-size: 60px; font-weight: 900; line-height: 1.05; margin-bottom: 16px; text-transform: uppercase;">
                    CONTROL YOUR WINDOWS PC <br/><span style="color: #c084fc; background: linear-gradient(135deg, #a855f7, #e9d5ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">FROM YOUR PHONE!</span>
                </h1>
                <p style="font-size: 22px; color: #e9d5ff; font-weight: 600;">
                    Turn your Android into a 120 FPS Precision Trackpad, Keyboard & Controller
                </p>
            </div>

            <div style="z-index: 10; display: flex; justify-content: center; position: relative;">
                <div class="glass-box" style="padding: 12px; position: relative; max-width: 820px;">
                    <img src="{hero_img}" style="width: 100%; height: 380px; object-fit: cover; border-radius: 20px;" />
                    <div style="position: absolute; bottom: 25px; right: 25px; background: rgba(9, 5, 20, 0.85); border: 1px solid #a855f7; padding: 10px 20px; border-radius: 14px; color: #a855f7; font-weight: 800; font-size: 18px; backdrop-filter: blur(10px);">
                        🎮 120 FPS HIGH REFRESH RATE
                    </div>
                </div>
            </div>

            <div class="ad-footer">
                <div class="ad-url mono">🌐 pcpilot.in</div>
                <div class="ad-cta-btn">GET FREE APP ➔</div>
            </div>
        </body>
        </html>
        """
    },

    # 2. 120 FPS High Refresh Rate
    {
        "id": "post_02_120fps",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head><style>{BASE_CSS}</style></head>
        <body>
            <div class="ad-grid"></div>
            <div class="glow-primary"></div>
            <div class="glow-secondary"></div>

            <div class="ad-header">
                <div class="ad-brand">
                    <img src="{icon_img}" class="ad-brand-icon" />
                    <div class="ad-brand-name cabinet">PC<span>Pilot</span></div>
                </div>
                <div class="ad-badge mono">⚡ ULTRA-LOW LATENCY</div>
            </div>

            <div style="z-index: 10; display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: center; margin: auto 0;">
                <div>
                    <div class="sticker" style="position: relative; display: inline-block; top: 0; transform: rotate(-2deg); margin-bottom: 20px;">
                        🔥 NO MORE MOUSE LAG!
                    </div>
                    <h1 class="cabinet" style="font-size: 64px; font-weight: 900; line-height: 1.05; margin-bottom: 20px; color: #fff;">
                        FLUID <span style="color: #c084fc;">120 FPS</span> TRACKING
                    </h1>
                    <p style="font-size: 20px; color: #e9d5ff; line-height: 1.5; margin-bottom: 30px;">
                        Instant cursor sync with zero perceptible delay over local Wi-Fi or high-speed USB tethering.
                    </p>
                    <div style="display: flex; gap: 16px;">
                        <div class="glass-box" style="padding: 16px 28px; text-align: center; border-color: #a855f7;">
                            <div class="mono" style="font-size: 38px; font-weight: 900; color: #a855f7;">120</div>
                            <div style="font-size: 14px; font-weight: 800; color: #e9d5ff;">FPS Refresh</div>
                        </div>
                        <div class="glass-box" style="padding: 16px 28px; text-align: center; border-color: #a855f7;">
                            <div class="mono" style="font-size: 38px; font-weight: 900; color: #a855f7;">&lt; 2ms</div>
                            <div style="font-size: 14px; font-weight: 800; color: #e9d5ff;">Response Time</div>
                        </div>
                    </div>
                </div>
                <div class="glass-box" style="padding: 20px; text-align: center; background: rgba(124, 58, 237, 0.15);">
                    <img src="{touchpad_img}" style="width: 100%; max-height: 480px; object-fit: contain; filter: drop-shadow(0 15px 30px rgba(0,0,0,0.5));" />
                </div>
            </div>

            <div class="ad-footer">
                <div class="ad-url mono">🌐 pcpilot.in</div>
                <div class="ad-cta-btn">TRY 120 FPS NOW ➔</div>
            </div>
        </body>
        </html>
        """
    },

    # 3. Touchpad Precision AD
    {
        "id": "post_03_touchpad",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head><style>{BASE_CSS}</style></head>
        <body>
            <div class="ad-grid"></div>
            <div class="glow-primary"></div>
            <div class="glow-secondary"></div>

            <div class="ad-header">
                <div class="ad-brand">
                    <img src="{icon_img}" class="ad-brand-icon" />
                    <div class="ad-brand-name cabinet">PC<span>Pilot</span></div>
                </div>
                <div class="ad-badge mono">🖱️ PRECISION MOUSE</div>
            </div>

            <div style="z-index: 10; margin: 15px 0; text-align: center; position: relative;">
                <div class="sticker" style="top: -10px; right: 180px;">✨ MULTI-TOUCH GESTURES</div>
                <h1 class="cabinet" style="font-size: 58px; font-weight: 900; line-height: 1.05; margin-bottom: 16px; color: #fff;">
                    TURN YOUR PHONE INTO A <br/><span style="color: #c084fc;">SMART TRACKPAD</span>
                </h1>
                <p style="font-size: 21px; color: #e9d5ff;">
                    Two-finger smooth scroll, pinch-to-zoom, right-click zones & haptic touch feedback.
                </p>
            </div>

            <div style="z-index: 10; display: flex; justify-content: center; align-items: center;">
                <div class="glass-box" style="padding: 20px; background: rgba(124, 58, 237, 0.15); border-color: #a855f7;">
                    <img src="{touchpad_img}" style="height: 460px; object-fit: contain;" />
                </div>
            </div>

            <div class="ad-footer">
                <div class="ad-url mono">🌐 pcpilot.in</div>
                <div class="ad-cta-btn">DOWNLOAD FREE ➔</div>
            </div>
        </body>
        </html>
        """
    },

    # 4. Keyboard Controls AD
    {
        "id": "post_04_keyboard",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head><style>{BASE_CSS}</style></head>
        <body>
            <div class="ad-grid"></div>
            <div class="glow-primary"></div>
            <div class="glow-secondary"></div>

            <div class="ad-header">
                <div class="ad-brand">
                    <img src="{icon_img}" class="ad-brand-icon" />
                    <div class="ad-brand-name cabinet">PC<span>Pilot</span></div>
                </div>
                <div class="tag-badge mono" style="background: #a855f7; color: #fff; padding: 8px 20px; border-radius: 999px; font-size: 16px; font-weight: 800;">⌨️ DESKTOP KEYBOARD</div>
            </div>

            <div style="z-index: 10; display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: center; margin: auto 0;">
                <div class="glass-box" style="padding: 20px; text-align: center; background: rgba(124, 58, 237, 0.15);">
                    <img src="{keyboard_img}" style="width: 100%; max-height: 480px; object-fit: contain;" />
                </div>
                <div>
                    <div class="sticker" style="position: relative; display: inline-block; top: 0; transform: rotate(3deg); margin-bottom: 20px;">
                        ⚡ FULL WINDOWS HOTKEYS
                    </div>
                    <h1 class="cabinet" style="font-size: 54px; font-weight: 900; line-height: 1.05; margin-bottom: 20px; color: #fff;">
                        TYPE & CONTROL <br/><span style="color: #c084fc;">FROM ANYWHERE</span>
                    </h1>
                    <div style="display: flex; flex-direction: column; gap: 14px;">
                        <div class="glass-box" style="padding: 16px 20px; display: flex; align-items: center; gap: 16px; border-color: rgba(192, 132, 252, 0.4);">
                            <span style="font-size: 32px;">⌨️</span>
                            <div>
                                <strong style="font-size: 18px; color: #fff;">Ctrl + Alt + Shift Shortcuts</strong>
                                <p style="font-size: 14px; color: #c084fc;">Full layout with Win key & Function rows.</p>
                            </div>
                        </div>
                        <div class="glass-card" style="padding: 16px 20px; display: flex; align-items: center; gap: 16px; background: rgba(255,255,255,0.05); border-radius: 20px; border: 1px solid rgba(192,132,252,0.3);">
                            <span style="font-size: 32px;">🚀</span>
                            <div>
                                <strong style="font-size: 18px; color: #fff;">Instant Wireless Typing</strong>
                                <p style="font-size: 14px; color: #c084fc;">Type seamlessly into Word, Chrome or Games.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="ad-footer">
                <div class="ad-url mono">🌐 pcpilot.in</div>
                <div class="ad-cta-btn">GET STARTED FREE ➔</div>
            </div>
        </body>
        </html>
        """
    },

    # 5. Live Telemetry & System Health AD
    {
        "id": "post_05_health",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head><style>{BASE_CSS}</style></head>
        <body>
            <div class="ad-grid"></div>
            <div class="glow-primary"></div>
            <div class="glow-secondary"></div>

            <div class="ad-header">
                <div class="ad-brand">
                    <img src="{icon_img}" class="ad-brand-icon" />
                    <div class="ad-brand-name cabinet">PC<span>Pilot</span></div>
                </div>
                <div class="ad-badge mono">📊 LIVE PC STATS</div>
            </div>

            <div style="z-index: 10; margin: 15px 0; text-align: center; position: relative;">
                <div class="sticker" style="top: -10px; left: 160px;">🎮 GAMERS & STREAMERS MUST-HAVE</div>
                <h1 class="cabinet" style="font-size: 56px; font-weight: 900; line-height: 1.05; margin-bottom: 16px; color: #fff;">
                    REAL-TIME PC HEALTH MONITOR
                </h1>
                <p style="font-size: 21px; color: #e9d5ff;">
                    Watch CPU load, GPU usage, RAM & system temperatures directly on your phone screen!
                </p>
            </div>

            <div style="z-index: 10; display: flex; justify-content: center; align-items: center;">
                <div class="glass-box" style="padding: 20px; background: rgba(124, 58, 237, 0.15); border-color: #a855f7;">
                    <img src="{health_img}" style="height: 460px; object-fit: contain;" />
                </div>
            </div>

            <div class="ad-footer">
                <div class="ad-url mono">🌐 pcpilot.in</div>
                <div class="ad-cta-btn">MONITOR YOUR PC ➔</div>
            </div>
        </body>
        </html>
        """
    },

    # 6. Power & Media Control AD
    {
        "id": "post_06_power",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head><style>{BASE_CSS}</style></head>
        <body>
            <div class="ad-grid"></div>
            <div class="glow-primary"></div>
            <div class="glow-secondary"></div>

            <div class="ad-header">
                <div class="ad-brand">
                    <img src="{icon_img}" class="ad-brand-icon" />
                    <div class="ad-brand-name cabinet">PC<span>Pilot</span></div>
                </div>
                <div class="ad-badge mono">🎛️ MEDIA & POWER REMOTE</div>
            </div>

            <div style="z-index: 10; display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: center; margin: auto 0;">
                <div>
                    <div class="sticker" style="position: relative; display: inline-block; top: 0; transform: rotate(-3deg); margin-bottom: 20px;">
                        🛋️ BED & COUCH CONTROLLER
                    </div>
                    <h1 class="cabinet" style="font-size: 54px; font-weight: 900; line-height: 1.05; margin-bottom: 20px; color: #fff;">
                        CONTROL MEDIA <br/><span style="color: #c084fc;">& PC POWER</span>
                    </h1>
                    <p style="font-size: 20px; color: #e9d5ff; margin-bottom: 24px; line-height: 1.5;">
                        Adjust volume, play/pause movies, skip tracks, lock, or shutdown your PC from across the room.
                    </p>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                        <div class="glass-box" style="padding: 14px; text-align: center; color: #fff; font-weight: 800; font-size: 16px;">
                            🔊 Master Volume
                        </div>
                        <div class="glass-box" style="padding: 14px; text-align: center; color: #fff; font-weight: 800; font-size: 16px;">
                            ⏯️ Media Control
                        </div>
                        <div class="glass-box" style="padding: 14px; text-align: center; color: #fff; font-weight: 800; font-size: 16px;">
                            🌙 Sleep Mode
                        </div>
                        <div class="glass-box" style="padding: 14px; text-align: center; color: #fff; font-weight: 800; font-size: 16px;">
                            ⚡ Remote Shutdown
                        </div>
                    </div>
                </div>
                <div class="glass-box" style="padding: 20px; text-align: center; background: rgba(124, 58, 237, 0.15);">
                    <img src="{power_img}" style="width: 100%; max-height: 480px; object-fit: contain;" />
                </div>
            </div>

            <div class="ad-footer">
                <div class="ad-url mono">🌐 pcpilot.in</div>
                <div class="ad-cta-btn">GET FREE REMOTE ➔</div>
            </div>
        </body>
        </html>
        """
    },

    # 7. Dual Connectivity AD
    {
        "id": "post_07_connection",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head><style>{BASE_CSS}</style></head>
        <body>
            <div class="ad-grid"></div>
            <div class="glow-primary"></div>
            <div class="glow-secondary"></div>

            <div class="ad-header">
                <div class="ad-brand">
                    <img src="{icon_img}" class="ad-brand-icon" />
                    <div class="ad-brand-name cabinet">PC<span>Pilot</span></div>
                </div>
                <div class="ad-badge mono">📡 DUAL CONNECTIVITY</div>
            </div>

            <div style="z-index: 10; text-align: center; margin: auto 0;">
                <div class="sticker" style="position: relative; display: inline-block; transform: rotate(-2deg); margin-bottom: 20px;">
                    ⚡ ZERO CONFIGURATION REQUIRED
                </div>
                <h1 class="cabinet" style="font-size: 60px; font-weight: 900; line-height: 1.05; margin-bottom: 20px; color: #fff;">
                    CONNECT OVER <span style="color: #c084fc;">WI-FI</span> OR <span style="color: #a855f7;">USB</span>
                </h1>
                <p style="font-size: 22px; color: #e9d5ff; max-width: 820px; margin: 0 auto 40px auto; line-height: 1.5;">
                    Instant automatic PC discovery over Wi-Fi, or zero-latency USB tethered mode for competitive gaming.
                </p>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 36px; max-width: 900px; margin: 0 auto;">
                    <div class="glass-box" style="padding: 36px 30px; text-align: left; border-color: #a855f7;">
                        <div style="font-size: 44px; margin-bottom: 12px;">📡</div>
                        <h3 class="cabinet" style="font-size: 30px; margin-bottom: 10px; color: #fff;">Wi-Fi Wireless</h3>
                        <p style="font-size: 16px; color: #c084fc; line-height: 1.5;">Auto-detects your Windows PC on local Wi-Fi with instant one-tap connection.</p>
                    </div>

                    <div class="glass-box" style="padding: 36px 30px; text-align: left; border-color: #a855f7;">
                        <div style="font-size: 44px; margin-bottom: 12px;">🔌</div>
                        <h3 class="cabinet" style="font-size: 30px; margin-bottom: 10px; color: #fff;">USB Cable Tether</h3>
                        <p style="font-size: 16px; color: #c084fc; line-height: 1.5;">Direct hardware tethering mode for zero signal interference & rock-solid stability.</p>
                    </div>
                </div>
            </div>

            <div class="ad-footer">
                <div class="ad-url mono">🌐 pcpilot.in</div>
                <div class="ad-cta-btn">CONNECT NOW ➔</div>
            </div>
        </body>
        </html>
        """
    },

    # 8. 100% Private / Zero Cloud AD
    {
        "id": "post_08_privacy",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head><style>{BASE_CSS}</style></head>
        <body>
            <div class="ad-grid"></div>
            <div class="glow-primary"></div>
            <div class="glow-secondary"></div>

            <div class="ad-header">
                <div class="ad-brand">
                    <img src="{icon_img}" class="ad-brand-icon" />
                    <div class="ad-brand-name cabinet">PC<span>Pilot</span></div>
                </div>
                <div class="ad-badge mono">🔒 PRIVACY FIRST</div>
            </div>

            <div style="z-index: 10; text-align: center; margin: auto 0;">
                <div class="glass-box" style="display: inline-block; padding: 14px 32px; margin-bottom: 25px; border-color: #facc15; background: rgba(250, 204, 21, 0.1);">
                    <span style="font-size: 24px; font-weight: 900; color: #facc15;">🛡️ ZERO CLOUD · ZERO ACCOUNTS</span>
                </div>
                <h1 class="cabinet" style="font-size: 62px; font-weight: 900; line-height: 1.05; margin-bottom: 24px; color: #fff;">
                    YOUR DATA NEVER LEAVES <br/><span style="color: #c084fc;">YOUR LOCAL NETWORK</span>
                </h1>
                <p style="font-size: 22px; color: #e9d5ff; max-width: 820px; margin: 0 auto; line-height: 1.6;">
                    PCPilot connects directly device-to-device. No logins, no cloud relay servers, no data harvesting. Just pure encrypted remote control.
                </p>
            </div>

            <div class="ad-footer">
                <div class="ad-url mono">🌐 pcpilot.in</div>
                <div class="ad-cta-btn">STAY PRIVATE FREE ➔</div>
            </div>
        </body>
        </html>
        """
    },

    # 9. PIN Pairing AD
    {
        "id": "post_09_security",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head><style>{BASE_CSS}</style></head>
        <body>
            <div class="ad-grid"></div>
            <div class="glow-primary"></div>
            <div class="glow-secondary"></div>

            <div class="ad-header">
                <div class="ad-brand">
                    <img src="{icon_img}" class="ad-brand-icon" />
                    <div class="ad-brand-name cabinet">PC<span>Pilot</span></div>
                </div>
                <div class="ad-badge mono">🔑 SECURE PAIRING</div>
            </div>

            <div style="z-index: 10; text-align: center; margin: auto 0;">
                <h1 class="cabinet" style="font-size: 58px; font-weight: 900; line-height: 1.05; margin-bottom: 30px; color: #fff;">
                    ENCRYPTED <span style="color: #c084fc;">PIN PAIRING</span>
                </h1>

                <div class="glass-box" style="padding: 40px; max-width: 620px; margin: 0 auto 30px auto; border-color: #a855f7;">
                    <div style="font-size: 20px; color: #c084fc; margin-bottom: 20px; font-weight: 800; letter-spacing: 1px;">ENTER 6-DIGIT PAIRING CODE</div>
                    <div style="display: flex; gap: 16px; justify-content: center;">
                        <div class="glass-box mono" style="width: 68px; height: 76px; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: 900; border-color: #a855f7; color: #a855f7; background: rgba(168,85,247,0.2);">8</div>
                        <div class="glass-box mono" style="width: 68px; height: 76px; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: 900; border-color: #a855f7; color: #a855f7; background: rgba(168,85,247,0.2);">4</div>
                        <div class="glass-box mono" style="width: 68px; height: 76px; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: 900; border-color: #a855f7; color: #a855f7; background: rgba(168,85,247,0.2);">1</div>
                        <div class="glass-box mono" style="width: 68px; height: 76px; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: 900; border-color: #a855f7; color: #a855f7; background: rgba(168,85,247,0.2);">9</div>
                        <div class="glass-box mono" style="width: 68px; height: 76px; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: 900; border-color: #a855f7; color: #a855f7; background: rgba(168,85,247,0.2);">2</div>
                        <div class="glass-box mono" style="width: 68px; height: 76px; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: 900; border-color: #a855f7; color: #a855f7; background: rgba(168,85,247,0.2);">7</div>
                    </div>
                </div>

                <p style="font-size: 21px; color: #e9d5ff; max-width: 720px; margin: 0 auto; line-height: 1.5;">
                    Block unauthorized network access. Only authorized phones with the active PIN can control your desktop.
                </p>
            </div>

            <div class="ad-footer">
                <div class="ad-url mono">🌐 pcpilot.in</div>
                <div class="ad-cta-btn">SECURE YOUR PC ➔</div>
            </div>
        </body>
        </html>
        """
    },

    # 10. Gamers & Creators AD
    {
        "id": "post_10_gamers_creators",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head><style>{BASE_CSS}</style></head>
        <body>
            <div class="ad-grid"></div>
            <div class="glow-primary"></div>
            <div class="glow-secondary"></div>

            <div class="ad-header">
                <div class="ad-brand">
                    <img src="{icon_img}" class="ad-brand-icon" />
                    <div class="ad-brand-name cabinet">PC<span>Pilot</span></div>
                </div>
                <div class="ad-badge mono">🌟 ULTIMATE DESK SETUP</div>
            </div>

            <div style="z-index: 10; margin: auto 0; text-align: center;">
                <div class="sticker" style="position: relative; display: inline-block; transform: rotate(-2deg); margin-bottom: 20px;">
                    ⭐ FOR GAMERS, STREAMERS & PROS
                </div>
                <h1 class="cabinet" style="font-size: 58px; font-weight: 900; line-height: 1.05; margin-bottom: 20px; color: #fff;">
                    ELEVATE YOUR <span style="color: #c084fc;">DESK SETUP</span>
                </h1>
                <p style="font-size: 22px; color: #e9d5ff; max-width: 820px; margin: 0 auto 36px auto; line-height: 1.5;">
                    Turn your smartphone into a dedicated auxiliary monitor and remote controller.
                </p>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 960px; margin: 0 auto;">
                    <div class="glass-box" style="padding: 32px 20px; text-align: left; border-color: #a855f7;">
                        <div style="font-size: 40px; margin-bottom: 10px;">🎮</div>
                        <strong style="font-size: 22px; color: #fff; display: block; margin-bottom: 8px;">Gamers</strong>
                        <p style="font-size: 15px; color: #c084fc; line-height: 1.4;">Track GPU/CPU stats live without overlay performance loss.</p>
                    </div>
                    <div class="glass-box" style="padding: 32px 20px; text-align: left; border-color: #a855f7;">
                        <div style="font-size: 40px; margin-bottom: 10px;">🎙️</div>
                        <strong style="font-size: 22px; color: #fff; display: block; margin-bottom: 8px;">Streamers</strong>
                        <p style="font-size: 15px; color: #c084fc; line-height: 1.4;">Adjust audio levels, mute mic & trigger OBS hotkeys.</p>
                    </div>
                    <div class="glass-box" style="padding: 32px 20px; text-align: left; border-color: #a855f7;">
                        <div style="font-size: 40px; margin-bottom: 10px;">💼</div>
                        <strong style="font-size: 22px; color: #fff; display: block; margin-bottom: 8px;">Creators</strong>
                        <p style="font-size: 15px; color: #c084fc; line-height: 1.4;">Remote clicker for slides, zoom & media playback.</p>
                    </div>
                </div>
            </div>

            <div class="ad-footer">
                <div class="ad-url mono">🌐 pcpilot.in</div>
                <div class="ad-cta-btn">UPGRADE YOUR DESK ➔</div>
            </div>
        </body>
        </html>
        """
    },

    # 11. 100% Free AD
    {
        "id": "post_11_free_lightweight",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head><style>{BASE_CSS}</style></head>
        <body>
            <div class="ad-grid"></div>
            <div class="glow-primary"></div>
            <div class="glow-secondary"></div>

            <div class="ad-header">
                <div class="ad-brand">
                    <img src="{icon_img}" class="ad-brand-icon" />
                    <div class="ad-brand-name cabinet">PC<span>Pilot</span></div>
                </div>
                <div class="ad-badge mono">🎁 100% FREE APP</div>
            </div>

            <div style="z-index: 10; text-align: center; margin: auto 0;">
                <div class="glass-box cabinet" style="display: inline-block; padding: 20px 60px; font-size: 80px; font-weight: 900; color: #facc15; margin-bottom: 30px; border-color: #facc15; background: rgba(250, 204, 21, 0.1);">
                    $0.00 FREE
                </div>
                <h1 class="cabinet" style="font-size: 58px; font-weight: 900; line-height: 1.05; margin-bottom: 20px; color: #fff;">
                    NO ADS. NO SUBSCRIPTIONS. <br/><span style="color: #c084fc;">NO HIDDEN FEES.</span>
                </h1>
                <p style="font-size: 22px; color: #e9d5ff; max-width: 800px; margin: 0 auto; line-height: 1.6;">
                    Lightweight background agent for Windows with negligible RAM footprint (&lt;15MB). Full remote features unlocked for everyone!
                </p>
            </div>

            <div class="ad-footer">
                <div class="ad-url mono">🌐 pcpilot.in</div>
                <div class="ad-cta-btn">DOWNLOAD FREE NOW ➔</div>
            </div>
        </body>
        </html>
        """
    },

    # 12. Presentation Clicker AD
    {
        "id": "post_12_presentation",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head><style>{BASE_CSS}</style></head>
        <body>
            <div class="ad-grid"></div>
            <div class="glow-primary"></div>
            <div class="glow-secondary"></div>

            <div class="ad-header">
                <div class="ad-brand">
                    <img src="{icon_img}" class="ad-brand-icon" />
                    <div class="ad-brand-name cabinet">PC<span>Pilot</span></div>
                </div>
                <div class="ad-badge mono">🎯 PRESENTATION REMOTE</div>
            </div>

            <div style="z-index: 10; display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: center; margin: auto 0;">
                <div>
                    <div class="sticker" style="position: relative; display: inline-block; top: 0; transform: rotate(-3deg); margin-bottom: 20px;">
                        🎤 PRESENT LIKE A PRO
                    </div>
                    <h1 class="cabinet" style="font-size: 54px; font-weight: 900; line-height: 1.05; margin-bottom: 20px; color: #fff;">
                        SMART SLIDE <br/><span style="color: #c084fc;">CLICKER</span>
                    </h1>
                    <p style="font-size: 20px; color: #e9d5ff; margin-bottom: 24px; line-height: 1.5;">
                        Step away from your PC. Control PowerPoint, Google Slides & PDF decks effortlessly from your phone.
                    </p>
                    <div class="glass-box" style="padding: 20px; display: flex; flex-direction: column; gap: 12px; border-color: #a855f7;">
                        <div style="display: flex; align-items: center; gap: 12px; color: #fff; font-size: 18px; font-weight: 800;">
                            <span>➡️</span> Next / Previous Slide Swipe
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px; color: #fff; font-size: 18px; font-weight: 800;">
                            <span>🎯</span> Touchpad Laser Pointer Mode
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px; color: #fff; font-size: 18px; font-weight: 800;">
                            <span>⏱️</span> Low-latency Wi-Fi Response
                        </div>
                    </div>
                </div>
                <div class="glass-box" style="padding: 20px; text-align: center; background: rgba(124, 58, 237, 0.15);">
                    <img src="{hero_img}" style="width: 100%; max-height: 480px; object-fit: cover; border-radius: 16px;" />
                </div>
            </div>

            <div class="ad-footer">
                <div class="ad-url mono">🌐 pcpilot.in</div>
                <div class="ad-cta-btn">PRESENT CONFIDENTLY ➔</div>
            </div>
        </body>
        </html>
        """
    },

    # 13. Glassmorphic Aesthetic AD
    {
        "id": "post_13_design_aesthetic",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head><style>{BASE_CSS}</style></head>
        <body>
            <div class="ad-grid"></div>
            <div class="glow-primary"></div>
            <div class="glow-secondary"></div>

            <div class="ad-header">
                <div class="ad-brand">
                    <img src="{icon_img}" class="ad-brand-icon" />
                    <div class="ad-brand-name cabinet">PC<span>Pilot</span></div>
                </div>
                <div class="ad-badge mono">🎨 MODERN UI DESIGN</div>
            </div>

            <div style="z-index: 10; margin: auto 0; text-align: center;">
                <div class="sticker" style="position: relative; display: inline-block; transform: rotate(-2deg); margin-bottom: 20px;">
                    ✨ STUNNING GLASSMORPHIC THEME
                </div>
                <h1 class="cabinet" style="font-size: 58px; font-weight: 900; line-height: 1.05; margin-bottom: 20px; color: #fff;">
                    CRAFTED FOR MODERN <br/><span style="color: #c084fc;">DESKTOP SETUPS</span>
                </h1>
                <p style="font-size: 22px; color: #e9d5ff; max-width: 800px; margin: 0 auto 36px auto; line-height: 1.5;">
                    Fluid glassmorphic UI, responsive controls, high-contrast visibility, and customizable sensitivity.
                </p>

                <div class="glass-box" style="padding: 24px; display: inline-block; background: rgba(124, 58, 237, 0.15); border-color: #a855f7;">
                    <img src="{hero_img}" style="max-width: 760px; border-radius: 16px;" />
                </div>
            </div>

            <div class="ad-footer">
                <div class="ad-url mono">🌐 pcpilot.in</div>
                <div class="ad-cta-btn">GET PCPILOT FREE ➔</div>
            </div>
        </body>
        </html>
        """
    },

    # 14. 3-Step Quick Setup AD
    {
        "id": "post_14_easy_setup",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head><style>{BASE_CSS}</style></head>
        <body>
            <div class="ad-grid"></div>
            <div class="glow-primary"></div>
            <div class="glow-secondary"></div>

            <div class="ad-header">
                <div class="ad-brand">
                    <img src="{icon_img}" class="ad-brand-icon" />
                    <div class="ad-brand-name cabinet">PC<span>Pilot</span></div>
                </div>
                <div class="ad-badge mono">⚡ FAST SETUP</div>
            </div>

            <div style="z-index: 10; margin: auto 0; text-align: center;">
                <h1 class="cabinet" style="font-size: 58px; font-weight: 900; line-height: 1.05; margin-bottom: 40px; color: #fff;">
                    SETUP IN <span style="color: #c084fc;">LESS THAN 60 SECONDS</span>
                </h1>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 960px; margin: 0 auto;">
                    <div class="glass-box" style="padding: 36px 24px; text-align: left; border-color: #a855f7;">
                        <div class="mono" style="font-size: 52px; font-weight: 900; color: #facc15; margin-bottom: 12px;">01</div>
                        <h3 class="cabinet" style="font-size: 26px; color: #fff; margin-bottom: 10px;">Download Agent</h3>
                        <p style="font-size: 15px; color: #c084fc; line-height: 1.5;">Install lightweight PCPilot Agent on Windows PC.</p>
                    </div>

                    <div class="glass-box" style="padding: 36px 24px; text-align: left; border-color: #a855f7;">
                        <div class="mono" style="font-size: 52px; font-weight: 900; color: #facc15; margin-bottom: 12px;">02</div>
                        <h3 class="cabinet" style="font-size: 26px; color: #fff; margin-bottom: 10px;">Open App</h3>
                        <p style="font-size: 15px; color: #c084fc; line-height: 1.5;">Launch PCPilot Android App; PC detects automatically.</p>
                    </div>

                    <div class="glass-box" style="padding: 36px 24px; text-align: left; border-color: #a855f7;">
                        <div class="mono" style="font-size: 52px; font-weight: 900; color: #facc15; margin-bottom: 12px;">03</div>
                        <h3 class="cabinet" style="font-size: 26px; color: #fff; margin-bottom: 10px;">Enter PIN</h3>
                        <p style="font-size: 15px; color: #c084fc; line-height: 1.5;">Enter security PIN and start controlling your PC!</p>
                    </div>
                </div>
            </div>

            <div class="ad-footer">
                <div class="ad-url mono">🌐 pcpilot.in</div>
                <div class="ad-cta-btn">START SETUP NOW ➔</div>
            </div>
        </body>
        </html>
        """
    },

    # 15. Final High Conversion CTA AD
    {
        "id": "post_15_cta_download",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head><style>{BASE_CSS}</style></head>
        <body>
            <div class="ad-grid"></div>
            <div class="glow-primary"></div>
            <div class="glow-secondary"></div>

            <div class="ad-header">
                <div class="ad-brand">
                    <img src="{icon_img}" class="ad-brand-icon" />
                    <div class="ad-brand-name cabinet">PC<span>Pilot</span></div>
                </div>
                <div class="ad-badge mono">📲 AVAILABLE NOW</div>
            </div>

            <div style="z-index: 10; text-align: center; margin: auto 0;">
                <div class="sticker" style="position: relative; display: inline-block; transform: rotate(-3deg); margin-bottom: 20px;">
                    ⭐ FREE WINDOWS & ANDROID DOWNLOAD
                </div>
                <h1 class="cabinet" style="font-size: 64px; font-weight: 900; line-height: 1.05; margin-bottom: 20px; color: #fff;">
                    TAKE CONTROL OF YOUR PC <br/><span style="color: #c084fc;">TODAY FOR FREE!</span>
                </h1>
                <p style="font-size: 24px; color: #e9d5ff; max-width: 800px; margin: 0 auto 36px auto; line-height: 1.5;">
                    Experience 120 FPS high refresh trackpad, keyboard, power remote & live PC health monitor.
                </p>

                <div style="display: flex; gap: 24px; justify-content: center;">
                    <div class="glass-box" style="padding: 18px 40px; font-size: 22px; font-weight: 900; color: #fff; border-color: #a855f7; background: rgba(168,85,247,0.2);">
                        🪟 WINDOWS AGENT
                    </div>
                    <div class="glass-box" style="padding: 18px 40px; font-size: 22px; font-weight: 900; color: #fff; border-color: #a855f7; background: rgba(168,85,247,0.2);">
                        🤖 ANDROID APP
                    </div>
                </div>
            </div>

            <div class="ad-footer">
                <div class="ad-url mono" style="font-size: 28px;">🌐 pcpilot.in</div>
                <div class="ad-cta-btn" style="font-size: 22px; padding: 16px 40px;">DOWNLOAD NOW ➔</div>
            </div>
        </body>
        </html>
        """
    }
]

def main():
    out_dir = "output_posts"
    os.makedirs(out_dir, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1080, "height": 1080})

        for idx, post in enumerate(POSTS, start=1):
            page.set_content(post["html"])
            page.wait_for_timeout(300)
            file_path = os.path.join(out_dir, f"{post['id']}.png")
            page.screenshot(path=file_path)
            print(f"Generated ({idx}/15): {file_path}")

        browser.close()

if __name__ == "__main__":
    main()
