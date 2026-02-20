#!/bin/bash
# Notification script that works in WSL2 and Linux

TITLE="Claude Code"
MESSAGE="${1:-Claude Code precisa da sua atenção}"

# Check if we're in WSL by checking for WSL_DISTRO_NAME or /proc/version
is_wsl() {
    if [ -n "$WSL_DISTRO_NAME" ]; then return 0; fi
    if grep -qi microsoft /proc/version 2>/dev/null; then return 0; fi
    return 1
}

# For WSL2, use PowerShell with Windows Toast
if is_wsl; then
    # Use a simple PowerShell script to show toast notification
    powershell.exe -NoProfile -Command "
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
        \$template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
        \$textNodes = \$template.GetElementsByTagName('text')
        \$textNodes.Item(0).AppendChild(\$template.CreateTextNode('$TITLE')) | Out-Null
        \$textNodes.Item(1).AppendChild(\$template.CreateTextNode('$MESSAGE')) | Out-Null
        \$toast = [Windows.UI.Notifications.ToastNotification]::new(\$template)
        [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('Claude Code').Show(\$toast)
    " 2>/dev/null
    exit 0
fi

# Try notify-send for native Linux (only if DBus is available)
if command -v notify-send &> /dev/null; then
    # Test if notify-send works by checking if we get a dbus error
    if ! notify-send --app-name="test" "test" "test" 2>&1 | grep -q "org.freedesktop.DBus.Error.ServiceUnknown"; then
        notify-send "$TITLE" "$MESSAGE"
        exit 0
    fi
fi

# Fallback: use terminal bell (works everywhere)
echo -e "\a"
exit 0
