package com.tecknnycs.nouracare;

import android.content.pm.ApplicationInfo;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onStart() {
        super.onStart();
        if (isDebugBuild()) {
            configureDebugWebViewNoCache();
        }
    }

    private boolean isDebugBuild() {
        return (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
    }

    /** Debug builds always load the latest synced bundle (no stale WebView cache). */
    private void configureDebugWebViewNoCache() {
        WebView webView = getBridge().getWebView();
        if (webView == null) {
            return;
        }
        webView.clearCache(true);
        WebSettings settings = webView.getSettings();
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
    }
}
