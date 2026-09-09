import os
import base64
from playwright.sync_api import sync_playwright

# Image folder path
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
@import url('https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@500,700,800,900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
    width: 1080px;
    height: 1080px;
    overflow: hidden;
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #0d0819;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 60px;
    position: relative;
}

.mono { font-family: 'JetBrains Mono', monospace; }
.cabinet { font-family: 'Cabinet Grotesk', sans-serif; }

/* Background decoration */
.bg-glow-1 {
    position: absolute;
    width: 700px;
    height: 700px;
    background: radial-gradient(circle, rgba(168, 85, 247, 0.45) 0%, rgba(124, 58, 237, 0.15) 50%, rgba(13, 8, 25) 80%);
    top: -200px;
    right: -200px;
    border-radius: 50%;
    filter: blur(80px);
    z-index: 0;
}

.bg-glow-2 {
    position: absolute;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(124, 58, 237, 0.4) 0%, rgba(76, 29, 149, 0.1) 60%, transparent 80%);
    bottom: -150px;
    left: -150px;
    border-radius: 50%;
    filter: blur(80px);
    z-index: 0;
}

.grid-pattern {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image: linear-gradient(rgba(192, 132, 252, 0.07) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(192, 132, 252, 0.07) 1px, transparent 1px);
    background-size: 40px 40px;
    z-index: 0;
}

/* Header */
.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 10;
}

.brand {
    display: flex;
    align-items: center;
    gap: 16px;
}

.brand-icon {
    width: 54px;
    height: 54px;
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(124, 58, 237, 0.5);
}

.brand-name {
    font-size: 32px;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: #ffffff;
}

.brand-name span {
    color: #c084fc;
}

.tag-badge {
    background: rgba(192, 132, 252, 0.15);
    border: 1px solid rgba(192, 132, 252, 0.4);
    color: #e9d5ff;
    padding: 10px 22px;
    border-radius: 999px;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.5px;
    backdrop-filter: blur(10px);
}

/* Footer */
.footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 10;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(220, 205, 242, 0.15);
    padding: 20px 32px;
    border-radius: 24px;
    backdrop-filter: blur(20px);
}

.domain {
    font-size: 22px;
    font-weight: 700;
    color: #c084fc;
    display: flex;
    align-items: center;
    gap: 8px;
}

.cta-btn {
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    color: #ffffff;
    font-size: 18px;
    font-weight: 800;
    padding: 12px 28px;
    border-radius: 999px;
    box-shadow: 0 8px 20px rgba(124, 58, 237, 0.4);
}

/* Card / Glass panel */
.glass-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(192, 132, 252, 0.25);
    border-radius: 32px;
    backdrop-filter: blur(24px);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}
"""

POSTS = [
    # 1. Hero / Overview
    {
        "id": "post_01_hero",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head><style>{BASE_CSS}</style></head>
        <body>
            <div class="grid-pattern"></div>
            <div class="bg-glow-1"></div>
            <div class="bg-glow-2"></div>

            <div class="header">
                <div class="brand">
                    <img src="{icon_img}" class="brand-icon" />
                    <div class="brand-name cabinet">PC<span>Pilot</span></div>
                </div>
                <div class="tag-badge mono">120 FPS REMOTE CONTROL</div>
            </div>

            <div style="z-index: 10; margin: 30px 0; text-align: center;">
                <h1 class="cabinet" style="font-size: 56px; font-weight: 900; line-height: 1.1; margin-bottom: 20px; background: linear-gradient(135deg, #ffffff 40%, #e9d5ff 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                    Turn Your Smartphone Into a Precision PC Remote
                </h1>
                <p style="font-size: 22px; color: #c084fc; max-width: 800px; margin: 0 auto; line-height: 1.5;">
                    Ultra-low latency trackpad, keyboard, system telemetry & power management for Windows.
                </p>
            </div>

            <div style="z-index: 10; display: flex; justify-content: center; align-items: center; position: relative;">
                <div class="glass-card" style="padding: 16px; overflow: hidden; max-width: 780px;">
                    <img src="{hero_img}" style="width: 100%; height: 380px; object-fit: cover; border-radius: 20px;" />
                </div>
            </div>

            <div class="footer">
                <div class="domain mono">🌐 pcpilot.in</div>
                <div class="cta-btn">Get Started Free</div>
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
            <div class="grid-pattern"></div>
            <div class="bg-glow-1"></div>
            <div class="bg-glow-2"></div>

            <div class="header">
                <div class="brand">
                    <img src="{icon_img}" class="brand-icon" />
                    <div class="brand-name cabinet">PC<span>Pilot</span></div>
                </div>
                <div class="tag-badge mono">ULTRA-LOW LATENCY</div>
            </div>

            <div style="z-index: 10; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; margin: auto 0;">
                <div>
                    <div style="display: inline-block; background: linear-gradient(135deg, #a855f7, #7c3aed); padding: 8px 20px; border-radius: 12px; font-size: 20px; font-weight: 800; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(168,85,247,0.4);">
                        ⚡ HIGH REFRESH RATE
                    </div>
                    <h1 class="cabinet" style="font-size: 64px; font-weight: 900; line-height: 1.05; margin-bottom: 24px; color: #fff;">
                        Smooth <span style="color: #c084fc;">120 FPS</span> Control
                    </h1>
                    <p style="font-size: 20px; color: #e9d5ff; line-height: 1.6; margin-bottom: 30px;">
                        Experience zero-lag mouse tracking and instant gesture input over Wi-Fi or USB tethering.
                    </p>
                    <div style="display: flex; gap: 16px;">
                        <div class="glass-card" style="padding: 16px 24px; text-align: center;">
                            <div class="mono" style="font-size: 32px; font-weight: 800; color: #a855f7;">120</div>
                            <div style="font-size: 14px; color: #c084fc;">Hz Refresh</div>
                        </div>
                        <div class="glass-card" style="padding: 16px 24px; text-align: center;">
                            <div class="mono" style="font-size: 32px; font-weight: 800; color: #a855f7;">&lt; 2ms</div>
                            <div style="font-size: 14px; color: #c084fc;">Response</div>
                        </div>
                    </div>
                </div>
                <div class="glass-card" style="padding: 20px; text-align: center;">
                    <img src="{touchpad_img}" style="width: 100%; max-height: 480px; object-fit: contain; border-radius: 16px;" />
                </div>
            </div>

            <div class="footer">
                <div class="domain mono">🌐 pcpilot.in</div>
                <div class="cta-btn">Experience 120 FPS</div>
            </div>
        </body>
        </html>
        """
    },

    # 3. Touchpad Showcase
    {
        "id": "post_03_touchpad",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head><style>{BASE_CSS}</style></head>
        <body>
            <div class="grid-pattern"></div>
            <div class="bg-glow-1"></div>
            <div class="bg-glow-2"></div>

            <div class="header">
                <div class="brand">
                    <img src="{icon_img}" class="brand-icon" />
                    <div class="brand-name cabinet">PC<span>Pilot</span></div>
                </div>
                <div class="tag-badge mono">PRECISION MOUSE</div>
            </div>

            <div style="z-index: 10; margin: 20px 0; text-align: center;">
                <h1 class="cabinet" style="font-size: 52px; font-weight: 900; line-height: 1.1; margin-bottom: 16px; color: #fff;">
                    Full Precision Multi-Touch Trackpad
                </h1>
                <p style="font-size: 20px; color: #e9d5ff; max-width: 750px; margin: 0 auto;">
                    Two-finger scrolling, pinch-to-zoom, right-click zones, and custom cursor sensitivity.
                </p>
            </div>

            <div style="z-index: 10; display: flex; justify-content: center; align-items: center;">
                <div class="glass-card" style="padding: 24px; background: rgba(124, 58, 237, 0.1); border-color: rgba(192, 132, 252, 0.4);">
                    <img src="{touchpad_img}" style="height: 480px; object-fit: contain; border-radius: 16px;" />
                </div>
            </div>

            <div class="footer">
                <div class="domain mono">🌐 pcpilot.in</div>
                <div class="cta-btn">Download Now</div>
            </div>
        </body>
        </html>
        """
    },

    # 4. Keyboard Controls
    {
        "id": "post_04_keyboard",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head><style>{BASE_CSS}</style></head>
        <body>
            <div class="grid-pattern"></div>
            <div class="bg-glow-1"></div>
            <div class="bg-glow-2"></div>

            <div class="header">
                <div class="brand">
                    <img src="{icon_img}" class="brand-icon" />
                    <div class="brand-name cabinet">PC<span>Pilot</span></div>
                </div>
                <div class="tag-badge mono">DESKTOP KEYBOARD</div>
            </div>

            <div style="z-index: 10; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; margin: auto 0;">
                <div class="glass-card" style="padding: 20px; text-align: center;">
                    <img src="{keyboard_img}" style="width: 100%; max-height: 480px; object-fit: contain; border-radius: 16px;" />
                </div>
                <div>
                    <h1 class="cabinet" style="font-size: 54px; font-weight: 900; line-height: 1.1; margin-bottom: 24px; color: #fff;">
                        Complete PC Keyboard in Your Hand
                    </h1>
                    <div style="display: flex; flex-direction: column; gap: 16px;">
                        <div class="glass-card" style="padding: 16px 20px; display: flex; align-items: center; gap: 16px;">
                            <span style="font-size: 28px;">⌨️</span>
                            <div>
                                <strong style="font-size: 18px; color: #fff;">Full Layout & Hotkeys</strong>
                                <p style="font-size: 14px; color: #c084fc;">Ctrl, Alt, Shift, Windows key & function rows.</p>
                            </div>
                        </div>
                        <div class="glass-card" style="padding: 16px 20px; display: flex; align-items: center; gap: 16px;">
                            <span style="font-size: 28px;">⚡</span>
                            <div>
                                <strong style="font-size: 18px; color: #fff;">Instant Type Sync</strong>
                                <p style="font-size: 14px; color: #c084fc;">Type seamlessly into any Windows app.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="footer">
                <div class="domain mono">🌐 pcpilot.in</div>
                <div class="cta-btn">Try PCPilot Today</div>
            </div>
        </body>
        </html>
        """
    },

    # 5. Live Telemetry & System Health
    {
        "id": "post_05_health",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head><style>{BASE_CSS}</style></head>
        <body>
            <div class="grid-pattern"></div>
            <div class="bg-glow-1"></div>
            <div class="bg-glow-2"></div>

            <div class="header">
                <div class="brand">
                    <img src="{icon_img}" class="brand-icon" />
                    <div class="brand-name cabinet">PC<span>Pilot</span></div>
                </div>
                <div class="tag-badge mono">LIVE TELEMETRY</div>
            </div>

            <div style="z-index: 10; margin: 20px 0; text-align: center;">
                <h1 class="cabinet" style="font-size: 52px; font-weight: 900; line-height: 1.1; margin-bottom: 16px; color: #fff;">
                    Real-Time PC Performance Monitor
                </h1>
                <p style="font-size: 20px; color: #e9d5ff;">
                    Keep track of CPU load, GPU usage, RAM consumption, and temperatures directly on your phone.
                </p>
            </div>

            <div style="z-index: 10; display: flex; justify-content: center; align-items: center;">
                <div class="glass-card" style="padding: 24px; background: rgba(124, 58, 237, 0.1); border-color: rgba(192, 132, 252, 0.4);">
                    <img src="{health_img}" style="height: 480px; object-fit: contain; border-radius: 16px;" />
                </div>
            </div>

            <div class="footer">
                <div class="domain mono">🌐 pcpilot.in</div>
                <div class="cta-btn">Monitor Your PC</div>
            </div>
        </body>
        </html>
        """
    },

    # 6. Power & Media Control
    {
        "id": "post_06_power",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head><style>{BASE_CSS}</style></head>
        <body>
            <div class="grid-pattern"></div>
            <div class="bg-glow-1"></div>
            <div class="bg-glow-2"></div>

            <div class="header">
                <div class="brand">
                    <img src="{icon_img}" class="brand-icon" />
                    <div class="brand-name cabinet">PC<span>Pilot</span></div>
                </div>
                <div class="tag-badge mono">MEDIA & POWER</div>
            </div>

            <div style="z-index: 10; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; margin: auto 0;">
                <div>
                    <h1 class="cabinet" style="font-size: 54px; font-weight: 900; line-height: 1.1; margin-bottom: 24px; color: #fff;">
                        Master Power & Media Remotely
                    </h1>
                    <p style="font-size: 20px; color: #e9d5ff; margin-bottom: 30px; line-height: 1.6;">
                        Control master volume, play/pause music, switch tracks, lock, sleep, or shutdown your PC from across the room.
                    </p>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div class="glass-card" style="padding: 16px; text-align: center; color: #e9d5ff; font-weight: 700;">
                            🔊 Volume Dial
                        </div>
                        <div class="glass-card" style="padding: 16px; text-align: center; color: #e9d5ff; font-weight: 700;">
                            ⏯️ Media Control
                        </div>
                        <div class="glass-card" style="padding: 16px; text-align: center; color: #e9d5ff; font-weight: 700;">
                            🌙 Sleep Mode
                        </div>
                        <div class="glass-card" style="padding: 16px; text-align: center; color: #e9d5ff; font-weight: 700;">
                            ⚡ Remote Power
                        </div>
                    </div>
                </div>
                <div class="glass-card" style="padding: 20px; text-align: center;">
                    <img src="{power_img}" style="width: 100%; max-height: 480px; object-fit: contain; border-radius: 16px;" />
                </div>
            </div>

            <div class="footer">
                <div class="domain mono">🌐 pcpilot.in</div>
                <div class="cta-btn">Control Everything</div>
            </div>
        </body>
        </html>
        """
    },

    # 7. Dual Connection: Wi-Fi & USB
    {
        "id": "post_07_connection",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head><style>{BASE_CSS}</style></head>
        <body>
            <div class="grid-pattern"></div>
            <div class="bg-glow-1"></div>
            <div class="bg-glow-2"></div>

            <div class="header">
                <div class="brand">
                    <img src="{icon_img}" class="brand-icon" />
                    <div class="brand-name cabinet">PC<span>Pilot</span></div>
                </div>
                <div class="tag-badge mono">DUAL CONNECTIVITY</div>
            </div>

            <div style="z-index: 10; text-align: center; margin: auto 0;">
                <h1 class="cabinet" style="font-size: 58px; font-weight: 900; line-height: 1.1; margin-bottom: 24px; color: #fff;">
                    Connect Over <span style="color: #c084fc;">Wi-Fi</span> or <span style="color: #a855f7;">USB Cable</span>
                </h1>
                <p style="font-size: 22px; color: #e9d5ff; max-width: 800px; margin: 0 auto 50px auto; line-height: 1.5;">
                    Seamless local Wi-Fi auto-discovery or ultra-stable zero-latency USB tethered mode.
                </p>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; max-width: 900px; margin: 0 auto;">
                    <div class="glass-card" style="padding: 40px 30px; text-align: left;">
                        <div style="font-size: 40px; margin-bottom: 16px;">📡</div>
                        <h3 class="cabinet" style="font-size: 28px; margin-bottom: 12px; color: #fff;">Wi-Fi Wireless</h3>
                        <p style="font-size: 16px; color: #c084fc; line-height: 1.5;">Automatic PC discovery on your local network. No complex IP configuration required.</p>
                    </div>

                    <div class="glass-card" style="padding: 40px 30px; text-align: left;">
                        <div style="font-size: 40px; margin-bottom: 16px;">🔌</div>
                        <h3 class="cabinet" style="font-size: 28px; margin-bottom: 12px; color: #fff;">USB Tethering</h3>
                        <p style="font-size: 16px; color: #c084fc; line-height: 1.5;">Direct hardware tethering mode for ultra-demanding environments and esports games.</p>
                    </div>
                </div>
            </div>

            <div class="footer">
                <div class="domain mono">🌐 pcpilot.in</div>
                <div class="cta-btn">Connect Instantly</div>
            </div>
        </body>
        </html>
        """
    },

    # 8. Zero Cloud & Privacy First
    {
        "id": "post_08_privacy",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head><style>{BASE_CSS}</style></head>
        <body>
            <div class="grid-pattern"></div>
            <div class="bg-glow-1"></div>
            <div class="bg-glow-2"></div>

            <div class="header">
                <div class="brand">
                    <img src="{icon_img}" class="brand-icon" />
                    <div class="brand-name cabinet">PC<span>Pilot</span></div>
                </div>
                <div class="tag-badge mono">100% PRIVATE</div>
            </div>

            <div style="z-index: 10; text-align: center; margin: auto 0;">
                <div class="glass-card" style="display: inline-block; padding: 12px 28px; margin-bottom: 30px; border-color: #a855f7;">
                    <span style="font-size: 24px; font-weight: 800; color: #a855f7;">🛡️ ZERO CLOUD · ZERO ACCOUNTS</span>
                </div>
                <h1 class="cabinet" style="font-size: 60px; font-weight: 900; line-height: 1.1; margin-bottom: 24px; color: #fff;">
                    Your Data Never Leaves <br/><span style="color: #c084fc;">Your Local Network</span>
                </h1>
                <p style="font-size: 22px; color: #e9d5ff; max-width: 820px; margin: 0 auto; line-height: 1.6;">
                    PCPilot creates a direct peer-to-peer encrypted channel between your phone and PC. No registration, no external servers, no tracking.
                </p>
            </div>

            <div class="footer">
                <div class="domain mono">🌐 pcpilot.in</div>
                <div class="cta-btn">Stay Private</div>
            </div>
        </body>
        </html>
        """
    },

    # 9. PIN Pairing
    {
        "id": "post_09_security",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head><style>{BASE_CSS}</style></head>
        <body>
            <div class="grid-pattern"></div>
            <div class="bg-glow-1"></div>
            <div class="bg-glow-2"></div>

            <div class="header">
                <div class="brand">
                    <img src="{icon_img}" class="brand-icon" />
                    <div class="brand-name cabinet">PC<span>Pilot</span></div>
                </div>
                <div class="tag-badge mono">SECURE PAIRING</div>
            </div>

            <div style="z-index: 10; text-align: center; margin: auto 0;">
                <h1 class="cabinet" style="font-size: 56px; font-weight: 900; line-height: 1.1; margin-bottom: 30px; color: #fff;">
                    Encrypted 6-Digit PIN Pairing
                </h1>

                <div class="glass-card" style="padding: 40px; max-width: 600px; margin: 0 auto 30px auto;">
                    <div style="font-size: 20px; color: #c084fc; margin-bottom: 20px; font-weight: 600;">ENTER PAIRING PIN</div>
                    <div style="display: flex; gap: 16px; justify-content: center;">
                        <div class="glass-card mono" style="width: 64px; height: 72px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 800; border-color: #a855f7; color: #a855f7;">8</div>
                        <div class="glass-card mono" style="width: 64px; height: 72px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 800; border-color: #a855f7; color: #a855f7;">4</div>
                        <div class="glass-card mono" style="width: 64px; height: 72px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 800; border-color: #a855f7; color: #a855f7;">1</div>
                        <div class="glass-card mono" style="width: 64px; height: 72px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 800; border-color: #a855f7; color: #a855f7;">9</div>
                        <div class="glass-card mono" style="width: 64px; height: 72px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 800; border-color: #a855f7; color: #a855f7;">2</div>
                        <div class="glass-card mono" style="width: 64px; height: 72px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 800; border-color: #a855f7; color: #a855f7;">7</div>
                    </div>
                </div>

                <p style="font-size: 20px; color: #e9d5ff; max-width: 700px; margin: 0 auto; line-height: 1.5;">
                    Prevent unauthorized connections. Only authorized devices with the temporary PIN can control your desktop.
                </p>
            </div>

            <div class="footer">
                <div class="domain mono">🌐 pcpilot.in</div>
                <div class="cta-btn">Secure Your Setup</div>
            </div>
        </body>
        </html>
        """
    },

    # 10. Ultimate Companion for Gamers & Creators
    {
        "id": "post_10_gamers_creators",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head><style>{BASE_CSS}</style></head>
        <body>
            <div class="grid-pattern"></div>
            <div class="bg-glow-1"></div>
            <div class="bg-glow-2"></div>

            <div class="header">
                <div class="brand">
                    <img src="{icon_img}" class="brand-icon" />
                    <div class="brand-name cabinet">PC<span>Pilot</span></div>
                </div>
                <div class="tag-badge mono">FOR GAMERS & CREATORS</div>
            </div>

            <div style="z-index: 10; margin: auto 0; text-align: center;">
                <h1 class="cabinet" style="font-size: 58px; font-weight: 900; line-height: 1.1; margin-bottom: 24px; color: #fff;">
                    The Ultimate Desk Companion
                </h1>
                <p style="font-size: 22px; color: #e9d5ff; max-width: 800px; margin: 0 auto 40px auto; line-height: 1.5;">
                    Monitor system thermals while gaming, switch audio tracks during streams, or control presentations hands-free.
                </p>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 960px; margin: 0 auto;">
                    <div class="glass-card" style="padding: 30px 20px;">
                        <div style="font-size: 36px; margin-bottom: 12px;">🎮</div>
                        <strong style="font-size: 20px; color: #fff; display: block; margin-bottom: 8px;">Gamers</strong>
                        <p style="font-size: 14px; color: #c084fc;">Track GPU/CPU stats on second screen without overlay clutter.</p>
                    </div>
                    <div class="glass-card" style="padding: 30px 20px;">
                        <div style="font-size: 36px; margin-bottom: 12px;">🎬</div>
                        <strong style="font-size: 20px; color: #fff; display: block; margin-bottom: 8px;">Streamers</strong>
                        <p style="font-size: 14px; color: #c084fc;">Adjust audio levels and trigger hotkeys seamlessly.</p>
                    </div>
                    <div class="glass-card" style="padding: 30px 20px;">
                        <div style="font-size: 36px; margin-bottom: 12px;">💻</div>
                        <strong style="font-size: 20px; color: #fff; display: block; margin-bottom: 8px;">Pros</strong>
                        <p style="font-size: 14px; color: #c084fc;">Remote presentation clicker and fast trackpad remote.</p>
                    </div>
                </div>
            </div>

            <div class="footer">
                <div class="domain mono">🌐 pcpilot.in</div>
                <div class="cta-btn">Elevate Your Desk</div>
            </div>
        </body>
        </html>
        """
    },

    # 11. 100% Free & Lightweight
    {
        "id": "post_11_free_lightweight",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head><style>{BASE_CSS}</style></head>
        <body>
            <div class="grid-pattern"></div>
            <div class="bg-glow-1"></div>
            <div class="bg-glow-2"></div>

            <div class="header">
                <div class="brand">
                    <img src="{icon_img}" class="brand-icon" />
                    <div class="brand-name cabinet">PC<span>Pilot</span></div>
                </div>
                <div class="tag-badge mono">100% FREE</div>
            </div>

            <div style="z-index: 10; text-align: center; margin: auto 0;">
                <div class="glass-card cabinet" style="display: inline-block; padding: 16px 40px; font-size: 72px; font-weight: 900; color: #a855f7; margin-bottom: 30px; border-color: rgba(192, 132, 252, 0.5);">
                    $0.00
                </div>
                <h1 class="cabinet" style="font-size: 56px; font-weight: 900; line-height: 1.1; margin-bottom: 24px; color: #fff;">
                    Free Forever. Zero Ads. Zero Subscription.
                </h1>
                <p style="font-size: 22px; color: #e9d5ff; max-width: 780px; margin: 0 auto; line-height: 1.6;">
                    Lightweight background agent for Windows with negligible RAM footprint (&lt;15MB). Full features unlocked for everyone.
                </p>
            </div>

            <div class="footer">
                <div class="domain mono">🌐 pcpilot.in</div>
                <div class="cta-btn">Get Free App</div>
            </div>
        </body>
        </html>
        """
    },

    # 12. Presentation Clicker
    {
        "id": "post_12_presentation",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head><style>{BASE_CSS}</style></head>
        <body>
            <div class="grid-pattern"></div>
            <div class="bg-glow-1"></div>
            <div class="bg-glow-2"></div>

            <div class="header">
                <div class="brand">
                    <img src="{icon_img}" class="brand-icon" />
                    <div class="brand-name cabinet">PC<span>Pilot</span></div>
                </div>
                <div class="tag-badge mono">PRESENTATION REMOTE</div>
            </div>

            <div style="z-index: 10; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; margin: auto 0;">
                <div>
                    <h1 class="cabinet" style="font-size: 54px; font-weight: 900; line-height: 1.1; margin-bottom: 24px; color: #fff;">
                        Next-Gen Presentation Remote
                    </h1>
                    <p style="font-size: 20px; color: #e9d5ff; margin-bottom: 30px; line-height: 1.6;">
                        Step away from your laptop. Control PowerPoint, Google Slides, and PDF decks effortlessly from your smartphone.
                    </p>
                    <div class="glass-card" style="padding: 20px; display: flex; flex-direction: column; gap: 12px;">
                        <div style="display: flex; align-items: center; gap: 12px; color: #fff; font-size: 18px; font-weight: 700;">
                            <span>➡️</span> Next / Previous Slide
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px; color: #fff; font-size: 18px; font-weight: 700;">
                            <span>🎯</span> Virtual Laser Pointer & Touchpad
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px; color: #fff; font-size: 18px; font-weight: 700;">
                            <span>⏱️</span> Low-latency response over Wi-Fi
                        </div>
                    </div>
                </div>
                <div class="glass-card" style="padding: 20px; text-align: center;">
                    <img src="{hero_img}" style="width: 100%; max-height: 480px; object-fit: cover; border-radius: 16px;" />
                </div>
            </div>

            <div class="footer">
                <div class="domain mono">🌐 pcpilot.in</div>
                <div class="cta-btn">Present Confidently</div>
            </div>
        </body>
        </html>
        """
    },

    # 13. Glassmorphic Aesthetic
    {
        "id": "post_13_design_aesthetic",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head><style>{BASE_CSS}</style></head>
        <body>
            <div class="grid-pattern"></div>
            <div class="bg-glow-1"></div>
            <div class="bg-glow-2"></div>

            <div class="header">
                <div class="brand">
                    <img src="{icon_img}" class="brand-icon" />
                    <div class="brand-name cabinet">PC<span>Pilot</span></div>
                </div>
                <div class="tag-badge mono">MODERN DESIGN</div>
            </div>

            <div style="z-index: 10; margin: auto 0; text-align: center;">
                <h1 class="cabinet" style="font-size: 60px; font-weight: 900; line-height: 1.1; margin-bottom: 24px; color: #fff;">
                    Designed for Modern Workspaces
                </h1>
                <p style="font-size: 22px; color: #e9d5ff; max-width: 800px; margin: 0 auto 40px auto; line-height: 1.5;">
                    Crafted with a premium glassmorphic UI, fluid animations, and high contrast visibility for dark & light setups.
                </p>

                <div class="glass-card" style="padding: 30px; display: inline-block; background: rgba(124, 58, 237, 0.15); border-color: rgba(192, 132, 252, 0.5);">
                    <img src="{hero_img}" style="max-width: 750px; border-radius: 16px;" />
                </div>
            </div>

            <div class="footer">
                <div class="domain mono">🌐 pcpilot.in</div>
                <div class="cta-btn">Upgrade Your Setup</div>
            </div>
        </body>
        </html>
        """
    },

    # 14. 3-Step Setup
    {
        "id": "post_14_easy_setup",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head><style>{BASE_CSS}</style></head>
        <body>
            <div class="grid-pattern"></div>
            <div class="bg-glow-1"></div>
            <div class="bg-glow-2"></div>

            <div class="header">
                <div class="brand">
                    <img src="{icon_img}" class="brand-icon" />
                    <div class="brand-name cabinet">PC<span>Pilot</span></div>
                </div>
                <div class="tag-badge mono">EASY SETUP</div>
            </div>

            <div style="z-index: 10; margin: auto 0; text-align: center;">
                <h1 class="cabinet" style="font-size: 56px; font-weight: 900; line-height: 1.1; margin-bottom: 40px; color: #fff;">
                    Up and Running in 3 Easy Steps
                </h1>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 960px; margin: 0 auto;">
                    <div class="glass-card" style="padding: 36px 24px; text-align: left; position: relative;">
                        <div class="mono" style="font-size: 48px; font-weight: 900; color: #a855f7; margin-bottom: 16px;">01</div>
                        <h3 class="cabinet" style="font-size: 24px; color: #fff; margin-bottom: 12px;">Install Agent</h3>
                        <p style="font-size: 15px; color: #c084fc; line-height: 1.5;">Download & launch PCPilot Agent on your Windows PC.</p>
                    </div>

                    <div class="glass-card" style="padding: 36px 24px; text-align: left; position: relative;">
                        <div class="mono" style="font-size: 48px; font-weight: 900; color: #a855f7; margin-bottom: 16px;">02</div>
                        <h3 class="cabinet" style="font-size: 24px; color: #fff; margin-bottom: 12px;">Open Mobile App</h3>
                        <p style="font-size: 15px; color: #c084fc; line-height: 1.5;">Open PCPilot on Android; your PC appears automatically.</p>
                    </div>

                    <div class="glass-card" style="padding: 36px 24px; text-align: left; position: relative;">
                        <div class="mono" style="font-size: 48px; font-weight: 900; color: #a855f7; margin-bottom: 16px;">03</div>
                        <h3 class="cabinet" style="font-size: 24px; color: #fff; margin-bottom: 12px;">Pair & Control</h3>
                        <p style="font-size: 15px; color: #c084fc; line-height: 1.5;">Enter the 6-digit security PIN and enjoy 120 FPS control!</p>
                    </div>
                </div>
            </div>

            <div class="footer">
                <div class="domain mono">🌐 pcpilot.in</div>
                <div class="cta-btn">Start Setup Now</div>
            </div>
        </body>
        </html>
        """
    },

    # 15. CTA / Download Now
    {
        "id": "post_15_cta_download",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head><style>{BASE_CSS}</style></head>
        <body>
            <div class="grid-pattern"></div>
            <div class="bg-glow-1"></div>
            <div class="bg-glow-2"></div>

            <div class="header">
                <div class="brand">
                    <img src="{icon_img}" class="brand-icon" />
                    <div class="brand-name cabinet">PC<span>Pilot</span></div>
                </div>
                <div class="tag-badge mono">AVAILABLE NOW</div>
            </div>

            <div style="z-index: 10; text-align: center; margin: auto 0;">
                <img src="{icon_img}" style="width: 120px; height: 120px; border-radius: 32px; box-shadow: 0 16px 40px rgba(124,58,237,0.6); margin-bottom: 30px;" />
                <h1 class="cabinet" style="font-size: 64px; font-weight: 900; line-height: 1.05; margin-bottom: 20px; color: #fff;">
                    Take Control of Your PC Today
                </h1>
                <p style="font-size: 24px; color: #e9d5ff; max-width: 780px; margin: 0 auto 40px auto; line-height: 1.5;">
                    Download PCPilot for Windows & Android. Free, secure, and blazing fast remote control.
                </p>

                <div style="display: flex; gap: 20px; justify-content: center;">
                    <div class="glass-card" style="padding: 16px 36px; font-size: 20px; font-weight: 800; color: #fff; border-color: #a855f7;">
                        🪟 Windows PC
                    </div>
                    <div class="glass-card" style="padding: 16px 36px; font-size: 20px; font-weight: 800; color: #fff; border-color: #a855f7;">
                        🤖 Android Mobile
                    </div>
                </div>
            </div>

            <div class="footer">
                <div class="domain mono" style="font-size: 28px;">🌐 pcpilot.in</div>
                <div class="cta-btn" style="font-size: 22px; padding: 16px 36px;">Download Free</div>
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
            # Wait briefly for fonts and images to render
            page.wait_for_timeout(300)
            file_path = os.path.join(out_dir, f"{post['id']}.png")
            page.screenshot(path=file_path)
            print(f"Generated ({idx}/15): {file_path}")

        browser.close()

if __name__ == "__main__":
    main()
