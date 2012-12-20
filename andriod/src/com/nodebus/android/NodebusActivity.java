package com.nodebus.android;

import com.nodebus.android.PullToRefreshListView;
import com.nodebus.android.PullToRefreshListView.OnRefreshListener;

import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings.Secure;

import android.app.AlertDialog;
import android.content.DialogInterface;
import android.view.LayoutInflater;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.View.OnClickListener;
//import android.view.View;
import android.text.format.DateUtils;
import android.text.format.Time;
import android.util.Log;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.SimpleAdapter;
import android.widget.TextView;
import android.app.ListActivity;

import android.content.Intent;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.widget.Toast;

public class NodebusActivity extends ListActivity {

	public static final String TAG = NodebusActivity.class.getSimpleName();
	private ArrayList<HashMap<String, Object>> mListItems;
	private SimpleAdapter mAdapter;
	private API mAPI;
	private String mDeviceID;
	private View mFooterView;
	private TextView mMoreView;
	private LinearLayout mLoadingView;

	private AlertDialog mLoginDialog;

	/** Called when the activity is first created. */
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.main);
		Log.i(TAG, "onCreate");// ??ʾ??ǰ״̬??onCreate??onDestroy??Ӧ

		SharedPreferences sp = this.getSharedPreferences(API.TAG, MODE_PRIVATE);
		mDeviceID = Secure.getString(this.getContentResolver(),
				Secure.ANDROID_ID);
		mAPI = new API(sp, mDeviceID);
		/** clear user for test. */
		// mAPI.clearUser();
		initLogin();
		/*
		 * Init
		 */
		if (mAPI.hasUser()) {
			doLogin(false);
		} else {
			mLoginDialog.show();
		}
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		menu.add(Menu.NONE, Menu.FIRST + 1, 1,
				getResources().getString(R.string.logout)).setIcon(
				android.R.drawable.ic_menu_revert);
		return true;
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		switch (item.getItemId()) {
		case Menu.FIRST + 1:
			this.doLogout();
			break;
		}
		return true;
	}

	private void startService() {
		String token = getSharedPreferences(API.TAG, MODE_PRIVATE).getString(
				API.KEY_TOKEN, "");
		String deviceId = getSharedPreferences(API.TAG, MODE_PRIVATE)
				.getString(API.KEY_DEVICE_ID, "");
		Editor editor = getSharedPreferences(PushService.TAG, MODE_PRIVATE)
				.edit();
		editor.putString(PushService.PREF_TOKEN, token);
		editor.putString(PushService.PREF_DEVICE_ID, deviceId);
		editor.commit();
		PushService.actionStart(getApplicationContext());
	}

	private void initLogin() {

		LayoutInflater factory = LayoutInflater.from(NodebusActivity.this);
		mLoginDialog = new AlertDialog.Builder(NodebusActivity.this)
				.setTitle(getResources().getString(R.string.login_title))
				.setMessage(R.string.login_notice)
				.setView(factory.inflate(R.layout.login, null))
				.setPositiveButton(getResources().getString(R.string.login),
						new DialogInterface.OnClickListener() {
							@Override
							public void onClick(DialogInterface dialog,
									int which) {
								// ???????????ý????ܹر?dialog
								try {
									Field field = dialog.getClass()
											.getSuperclass()
											.getDeclaredField("mShowing");
									field.setAccessible(true);
									field.set(dialog, false);
								} catch (Exception e) {
									e.printStackTrace();
								}
								doLogin(true);
							}
						})
				.setNeutralButton(getResources().getString(R.string.signup),
						new DialogInterface.OnClickListener() {
							@Override
							public void onClick(DialogInterface dialog,
									int which) {
								// ???????????ý????ܹر?dialog
								try {
									Field field = dialog.getClass()
											.getSuperclass()
											.getDeclaredField("mShowing");
									field.setAccessible(true);
									field.set(dialog, false);
								} catch (Exception e) {
									e.printStackTrace();
								}
								String url = "http://m.nodebus.com/signup";
								Intent i = new Intent(Intent.ACTION_VIEW);
								i.setData(Uri.parse(url));
								startActivity(i);
							}
						})
				// .setNegativeButton(getResources().getString(R.string.cancel),
				// new DialogInterface.OnClickListener(){
				// @Override
				// public void onClick(DialogInterface dialog, int which) {
				// NodebusActivity.this.finish();
				// }
				// })
				.create();
	}

	private void initList() {
		/* list init */
		mListItems = new ArrayList<HashMap<String, Object>>();
		mAdapter = new SimpleAdapter(this,
				(ArrayList<HashMap<String, Object>>) mListItems,
				R.layout.listitem, new String[] { "mtitle", "msg", "mtime" },
				new int[] { R.id.listitem_title, R.id.listitem_content, R.id.listitem_time });
		setListAdapter(mAdapter);

		/* list pull */

		((PullToRefreshListView) getListView())
				.setOnRefreshListener(new OnRefreshListener() {
					@Override
					public void onRefresh() {
						// Do work to refresh the list here.
						getNewMessages();
						((PullToRefreshListView) getListView())
								.onRefreshComplete();
					}
				});

		/* list more */
		mFooterView = LayoutInflater.from(this).inflate(R.layout.load_more,
				null);
		getListView().addFooterView(mFooterView);
		mMoreView = (TextView) findViewById(R.id.more);
		mLoadingView = (LinearLayout) findViewById(R.id.loading);

		mMoreView.setOnClickListener(new OnClickListener() {
			@Override
			public void onClick(View v) {
				mMoreView.setVisibility(View.GONE);
				mLoadingView.setVisibility(View.VISIBLE);
				getMoreMessages();
				mLoadingView.setVisibility(View.GONE);
			}
		});
	}

	private void hideLogin() {
		try {
			Field field = mLoginDialog.getClass().getSuperclass()
					.getDeclaredField("mShowing");
			field.setAccessible(true);
			field.set(mLoginDialog, true);
		} catch (Exception e) {
			e.printStackTrace();
		}
		mLoginDialog.dismiss();
	}

	private void doLogin(boolean fromView) {

		if (fromView) {
			EditText loginText = (EditText) mLoginDialog
					.findViewById(R.id.login);
			EditText passText = (EditText) mLoginDialog
					.findViewById(R.id.password);
			String name = loginText.getText().toString();
			String pass = passText.getText().toString();
			if (name == null || name.length() == 0) {
				loginText.requestFocus();
				return;
			}
			if (pass == null || pass.length() == 0) {
				passText.requestFocus();
				return;
			}
			Log.i(TAG, "login " + name + ":" + pass);
			mAPI.setUser(name, pass);
		}

		// mPDialog = ProgressDialog.show(NodebusActivity.this, getResources()
		// .getString(R.string.waiting),
		// getResources().getString(R.string.logining), true);
		// mPDialog.dismiss();
		if (fromView) {
			mLoginDialog.getButton(AlertDialog.BUTTON_POSITIVE).setEnabled(
					false);
		}
		try {
			mAPI.registerClient();
			hideLogin();
		} catch (APIException e) {
			Log.e(TAG, e.toString());
			if (e.getStatusCode() >= 1101) {
				mLoginDialog.setMessage(getResources().getString(
						R.string.error_auth));
				mAPI.clearUser();
				if (!fromView) {
					mLoginDialog.show();
				}
			} else {
				if (fromView) {
					mLoginDialog.setMessage(getResources().getString(
							R.string.error_connect));
				} else {
					showDialog(getResources().getString(R.string.error_connect));
					// this.showToast(getResources().getString(
					// R.string.error_connect));
				}
			}
			if (fromView) {
				mLoginDialog.getButton(AlertDialog.BUTTON_POSITIVE).setEnabled(
						true);
			}
			return;
		}
		startService();
		initList();
		getMessages();
	}

	private void doLogout() {
		if (mAPI.loggedIn()) {
			try {
				mAPI.delClient();
			} catch (APIException e) {
				// Auto-generated catch block
			}
			mAPI.clearUser();
			PushService.actionStop(getApplicationContext());
			initLogin();
			this.mLoginDialog.show();
		} else {
			this.showToast(getResources().getString(R.string.login_atfrist));
		}
	}

	private void showToast(String text) {
		Toast.makeText(this, text, Toast.LENGTH_SHORT).show();
	}

	private void showDialog(String text) {
		AlertDialog alert = new AlertDialog.Builder(NodebusActivity.this)
				.setMessage(text)
				.setPositiveButton(getResources().getString(R.string.confirm),
						new DialogInterface.OnClickListener() {
							@Override
							public void onClick(DialogInterface dialog,
									int which) {
								// NodebusActivity.this.finish();
							}
						}).create();
		alert.show();
	}

	private void addMessage(HashMap<String, String> msg, boolean isNew) {
		HashMap<String, Object> map = new HashMap<String, Object>();
		map.put("id", msg.get("id"));
		map.put("msg", msg.get("msg"));
		map.put("title", msg.get("title"));
		map.put("type", msg.get("type"));
		map.put("nodeName", msg.get("nodeName"));
		map.put("nodeLabel", msg.get("nodeLabel"));
		map.put("uri", msg.get("uri"));
		map.put("createdAt", msg.get("createdAt"));
		
		map.put("mtitle", msg.get("nodeLabel") + " " + msg.get("title"));
		Time time = new Time();
		time.parse3339(msg.get("createdAt"));
		map.put("mtime", android.text.format.DateFormat.format("MM-dd hh:mm", new Date(time.toMillis(false))));

		if (isNew) {
			mListItems.add(0, map);
		} else {
			mListItems.add(map);
		}
		mAdapter.notifyDataSetChanged();
	}

	private void addMessages(ArrayList<HashMap<String, String>> messages,
			boolean isNew) {
		for (int i = 0; i < messages.size(); i++) {
			addMessage(messages.get(i), isNew);
		}
	}

	private void getNewMessages() {
		ArrayList<HashMap<String, String>> messages = null;
		try {
			messages = mAPI.getNewMessages();
			Log.i(TAG, messages.toString());
			if (messages.size() == 0) {
				showToast(getResources().getString(R.string.empty_new_message));
			}
		} catch (APIException e) {
			showToast(getResources().getString(R.string.error_connect));
		}
		if (messages != null && messages.size() > 0) {
			addMessages(messages, true);
		}
	}

	private void getMoreMessages() {
		ArrayList<HashMap<String, String>> messages = null;
		try {
			messages = mAPI.getMoreMessages();
			Log.i(TAG, messages.toString());
		} catch (APIException e) {
			showToast(getResources().getString(R.string.error_connect));
		}
		if (messages != null && messages.size() > 0) {
			addMessages(messages, false);
		}

		if (mAPI.messageFinished()) {
			getListView().removeFooterView(mFooterView);
		}
	}

	private void getMessages() {
		ArrayList<HashMap<String, String>> messages = null;
		try {
			messages = mAPI.getMessages();
			Log.i(TAG, messages.toString());
			if (messages.size() == 0) {
				showToast(getResources().getString(R.string.empty_message));
			}
		} catch (APIException e) {
			showToast(getResources().getString(R.string.error_connect));
			return;
		}
		addMessages(messages, false);
		if (mAPI.messageFinished()) {
			getListView().removeFooterView(mFooterView);
		}
	}

	public void onDestroy() {
		super.onDestroy();
		Log.i(TAG, "onDestroy");// ??ʾ??ǰ״̬??onCreate??onDestroy??Ӧ
	}

	@Override
	public void onStart() {
		super.onStart();
		Log.i(TAG, "onStart");// ??ʾ??ǰ״̬??onStart??onStop??Ӧ
	}

	@Override
	public void onStop() {
		super.onStop();
		Log.i(TAG, "onStop");// ??ʾ??ǰ״̬??onStart??onStop??Ӧ
	}

	@Override
	public void onRestart() {
		super.onRestart();
		Log.i(TAG, "onRestart");
	}

	@Override
	public void onResume() {
		super.onResume();
		Log.i(TAG, "onResume");// ??ʾ??ǰ״̬??onPause??onResume??Ӧ
	}

	@Override
	public void onPause() {
		super.onResume();
		Log.i(TAG, "onPause");// ??ʾ??ǰ״̬??onPause??onResume??Ӧ
	}
}
