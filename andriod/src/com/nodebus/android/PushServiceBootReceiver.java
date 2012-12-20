package com.nodebus.android;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class PushServiceBootReceiver extends BroadcastReceiver {

	@Override
	public void onReceive(Context context, Intent intent) {
		// TODO Auto-generated method stub
		boolean logged_in = context.getSharedPreferences(API.TAG,
				Context.MODE_PRIVATE).getBoolean(API.KEY_LOGGED_IN, false);
		Log.e(NodebusActivity.TAG, "boot service");
		if (logged_in) {
			PushService.actionStart(context);
		}
	}

}
