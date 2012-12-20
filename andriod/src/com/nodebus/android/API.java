package com.nodebus.android;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.NameValuePair;
import org.apache.http.client.HttpClient;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.message.BasicNameValuePair;
import org.apache.http.params.BasicHttpParams;
import org.apache.http.params.HttpConnectionParams;
import org.apache.http.protocol.HTTP;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.SharedPreferences;
import android.util.Log;
import java.util.Random;
import android.os.Build;

public class API {
	public static final String TAG = API.class.getSimpleName();
	private static final String USER_AGENT = "nodebus-android/1.0";
	/*
	 * Limit count every page.
	 */
	public static final int COUNT = 20;

	/*
	 * Keys
	 */
	public static final String KEY_TOKEN = "token";
	public static final String KEY_DEVICE_ID = "device_id";
	public static final String KEY_LOGGED_IN = "logged_in";
	private static final String KEY_LOGIN = "login";
	private static final String KEY_PASSWORD = "password";

	/*
	 * API url
	 */
	//private static final String BASE_URL = "http://10.0.2.2:3000/1";
	private static final String BASE_URL = "http://api.nodebus.com/1";
	protected static final String EXTENSION = ".json";
	protected static final String REGISTER_CLIENT_URL = BASE_URL
			+ "/register_client" + EXTENSION;
	protected static final String DEL_CLIENT_URL = BASE_URL + "/del_client"
			+ EXTENSION;
	protected static final String MESSAGES_URL = BASE_URL + "/messages"
			+ EXTENSION;

	protected static final Integer DEFAULT_GET_REQUEST_TIMEOUT = 15000;
	protected static final Integer DEFAULT_POST_REQUEST_TIMEOUT = 20000;

	protected String mLogin;

	protected String mPassword;

	protected String mToken;

	protected String mDeviceID;

	protected final SharedPreferences mSharedPreference;

	protected String mLastMessageId = "";

	protected String mSinceMessageId = "";

	protected int mMessagePage = 1;

	protected boolean mMessageFinished = false;

	public API(SharedPreferences sp, String deviceId) {
		mSharedPreference = sp;
		mLogin = sp.getString(KEY_LOGIN, "");
		mPassword = sp.getString(KEY_PASSWORD, "");
		mToken = sp.getString(KEY_TOKEN, "");
		mDeviceID = sp.getString(KEY_DEVICE_ID, "");
		initToken(deviceId);
	}

	public String getToken() {
		return mToken;
	}

	public String getLogin() {
		return mLogin;
	}

	public String getPassword() {
		return mPassword;
	}
	
	public boolean loggedIn(){
		return mSharedPreference.getBoolean(KEY_LOGGED_IN, false);
	}

	public boolean hasUser() {
		return mLogin.length() > 0 && mPassword.length() > 0;
	}

	public void setUser(String login, String password) {
		setPassword(password);
		setLogin(login);
	}

	public void clearUser() {
		setPassword(null);
		setLogin(null);
		mSharedPreference.edit().putBoolean(KEY_LOGGED_IN, false).commit();
	}

	public void setPassword(String password) {
		if (password == null) {
			password = "";
		}
		if (password.compareTo(mPassword) != 0) {
			mPassword = password;
			mSharedPreference.edit().putString(KEY_PASSWORD, mPassword)
					.commit();
		}
	}

	public void setLogin(String login) {
		if (login == null) {
			login = "";
		}
		if (login.compareTo(mLogin) != 0) {
			mLogin = login;
			mSharedPreference.edit().putString(KEY_LOGIN, mLogin).commit();
		}
	}

	/**
	 * Get messages first time.
	 * 
	 * @return JSONArray
	 * @throws APIException
	 */

	public ArrayList<HashMap<String, String>> getMessages() throws APIException {
		mMessageFinished = false;
		mMessagePage = 1;
		mLastMessageId = "";
		mSinceMessageId = "";
		ArrayList<HashMap<String, String>> messages = getMessages(1, null, null);
		if (messages.size() < COUNT) {
			mMessageFinished = true;
		}
		if (messages.size() > 0) {

			HashMap<String, String> obj = messages.get(0);
			String id = obj.get("id");
			if (id != null && id.length() > 0) {
				mLastMessageId = id;
				mSinceMessageId = id;
			}

		}
		return messages;
	}

	/**
	 * Get more messages.
	 * 
	 * @return JSONArray
	 * @throws APIException
	 */

	public ArrayList<HashMap<String, String>> getMoreMessages()
			throws APIException {
		if (!mMessageFinished) {
			mMessagePage++;
			ArrayList<HashMap<String, String>> messages = getMessages(
					mMessagePage, mLastMessageId, null);
			if (messages.size() < COUNT) {
				mMessageFinished = true;
			}
			return messages;
		}
		return new ArrayList<HashMap<String, String>>();
	}

	/**
	 * Get mew messages.
	 * 
	 * @return JSONArray
	 * @throws APIException
	 */

	public ArrayList<HashMap<String, String>> getNewMessages()
			throws APIException {
		ArrayList<HashMap<String, String>> messages = getMessages(1, null,
				mSinceMessageId);
		if (messages.size() > 0) {

			HashMap<String, String> obj = messages.get(0);
			String id = obj.get("id");
			if (id != null && id.length() > 0) {
				mSinceMessageId = id;
				if(mLastMessageId == null || mLastMessageId.length() == 0){
					mLastMessageId = id;
					if (messages.size() < COUNT) {
						mMessageFinished = true;
					}
				}
			}

		}
		return messages;
	}

	/**
	 * Get mew messages.
	 * 
	 * @return JSONArray
	 * @throws APIException
	 */

	public boolean messageFinished() {
		return mMessageFinished;
	}

	/**
	 * 
	 * @param statusId
	 * @return JSONArray
	 * @throws APIException
	 */
	public ArrayList<HashMap<String, String>> getMessages(int page,
			String maxId, String sinceId) throws APIException {
		String url = MESSAGES_URL;
		url += "?count=" + COUNT;
		if (maxId != null && maxId.length() > 0) {
			url += "&max_id=" + maxId;
		}
		if (sinceId != null && sinceId.length() > 0) {
			url += "&since_id=" + sinceId;
		}
		if (page > 1) {
			url += "&page=" + page;
		}

		JSONArray jArr = null;
		String request = getRequest(url);
		JSONObject jObj = null;
		try {
			jObj = new JSONObject(request);
		} catch (Exception e) {
			throw new APIException(e);
		}
		parseResponseCode(jObj);
		try {
			jArr = jObj.getJSONArray("response_data");
		} catch (Exception e) {
			throw new APIException(e);
		}
		ArrayList<HashMap<String, String>> mylist = new ArrayList<HashMap<String, String>>();
		try {
			for (int i = 0; i < jArr.length(); i++) {
				HashMap<String, String> map = new HashMap<String, String>();
				JSONObject e = jArr.getJSONObject(i);
				map.put("id", e.getString("id"));
				map.put("nodeLabel", e.getString("nodeLabel"));
				map.put("nodeName", e.getString("nodeName"));
				if (e.has("msg") && !e.isNull("msg")) {
					map.put("msg", e.getString("msg"));
				}
				if (e.has("title") && !e.isNull("title")) {
					map.put("title", e.getString("title"));
				}
				if (e.has("type") && !e.isNull("type")) {
					map.put("type", e.getString("type"));
				}
				if (e.has("createdAt") && !e.isNull("createdAt")) {
					map.put("createdAt", e.getString("createdAt"));
				}
				if (e.has("uri") && !e.isNull("uri")) {
					map.put("uri", e.getString("uri"));
				}
				mylist.add(map);
			}
		} catch (JSONException e) {
			Log.e(TAG, "getMessages: Error parsing data " + e.toString());
		} catch (Exception e) {
		}
		return mylist;
	}

	/**
	 * 
	 * @return JSONObject
	 * @throws APIException
	 * 
	 */

	public void registerClient() throws APIException {
		String url = REGISTER_CLIENT_URL;
		List<NameValuePair> formParams = new ArrayList<NameValuePair>();
		formParams.add(new BasicNameValuePair("id", mDeviceID));
		formParams.add(new BasicNameValuePair("type", "android"));
		formParams.add(new BasicNameValuePair("desc", USER_AGENT));
		formParams.add(new BasicNameValuePair("token", mToken));
		formParams.add(new BasicNameValuePair("platform", Build.MODEL + " "
				+ Build.VERSION.RELEASE + " " + Build.VERSION.SDK));

		JSONObject jObj = null;
		try {
			jObj = new JSONObject(postRequest(url, new UrlEncodedFormEntity(
					formParams, HTTP.UTF_8)));
		} catch (Exception e) {
			throw new APIException(e);
		}
		parseResponseCode(jObj);
		mSharedPreference.edit().putBoolean(KEY_LOGGED_IN, true).commit();
	}

	public void delClient() throws APIException {
		String url = DEL_CLIENT_URL;
		List<NameValuePair> formParams = new ArrayList<NameValuePair>();
		formParams.add(new BasicNameValuePair("id", mDeviceID));
		formParams.add(new BasicNameValuePair("type", "android"));

		JSONObject jObj = null;
		try {
			jObj = new JSONObject(postRequest(url, new UrlEncodedFormEntity(
					formParams, HTTP.UTF_8)));
		} catch (Exception e) {
			throw new APIException(e);
		}
		parseResponseCode(jObj);
	}

	public static String getRandomString(int length) {
		String base = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
		Random random = new Random();
		StringBuffer sb = new StringBuffer();
		for (int i = 0; i < length; i++) {
			int number = random.nextInt(base.length());
			sb.append(base.charAt(number));
		}
		return sb.toString();
	}

	private void initToken(String deviceID) {
		if (mToken.length() == 0 || mDeviceID.length() == 0) {
			String key = getRandomString(7);
			mDeviceID = key + deviceID;
			if (mDeviceID.length() > 23) {
				mDeviceID = mDeviceID.substring(0, 22);
			}
			mToken = "nodebus/" + mDeviceID;
			mSharedPreference.edit().putString(KEY_TOKEN, mToken)
					.putString(KEY_DEVICE_ID, mDeviceID).commit();
		}
	}

	/**
	 * Execute a GET request against the Nodebus REST API.
	 * 
	 * @param url
	 * @return String
	 * @throws APIException
	 */
	private String getRequest(String url) throws APIException {
		return getRequest(url, new DefaultHttpClient(new BasicHttpParams()));
	}

	/**
	 * Execute a GET request against the Nodebus REST API.
	 * 
	 * @param url
	 * @param client
	 * @return String
	 * @throws APIException
	 */
	private String getRequest(String url, HttpClient client)
			throws APIException {
		String result = null;
		// int statusCode = 0;
		HttpGet getMethod = new HttpGet(url);
		try {
			getMethod.setHeader("User-Agent", USER_AGENT);
			getMethod.addHeader("Authorization", "Basic " + getCredentials());
			client.getParams().setIntParameter(
					HttpConnectionParams.CONNECTION_TIMEOUT,
					DEFAULT_GET_REQUEST_TIMEOUT);
			client.getParams().setIntParameter(HttpConnectionParams.SO_TIMEOUT,
					DEFAULT_GET_REQUEST_TIMEOUT);
			HttpResponse httpResponse = client.execute(getMethod);
			// statusCode = httpResponse.getStatusLine().getStatusCode();
			result = retrieveInputStream(httpResponse.getEntity());
		} catch (Exception e) {
			Log.e(TAG, "getRequest: " + e.toString());
			throw new APIException(e);
		} finally {
			getMethod.abort();
		}
		// parseStatusCode(statusCode, url);
		return result;
	}

	/**
	 * Execute a POST request against the Nodebus REST API.
	 * 
	 * @param url
	 * @return String
	 * @throws APIException
	 */
	/*
	 * private String postRequest(String url) throws APIException { return
	 * postRequest(url, new DefaultHttpClient(new BasicHttpParams()), null); }
	 */

	/**
	 * Execute a POST request against the Nodebus REST API.
	 * 
	 * @param url
	 * @return String
	 * @throws APIException
	 */
	private String postRequest(String url, UrlEncodedFormEntity formParams)
			throws APIException {
		return postRequest(url, new DefaultHttpClient(new BasicHttpParams()),
				formParams);
	}

	/**
	 * Execute a POST request against the Nodebus REST API.
	 * 
	 * @param url
	 * @param client
	 * @return String
	 * @throws APIException
	 */
	private String postRequest(String url, HttpClient client,
			UrlEncodedFormEntity formParams) throws APIException {
		String result = null;
		// int statusCode = 0;
		HttpPost postMethod = new HttpPost(url);
		try {
			postMethod.setHeader("User-Agent", USER_AGENT);
			postMethod.addHeader("Authorization", "Basic " + getCredentials());
			if (formParams != null) {
				postMethod.setEntity(formParams);
			}
			client.getParams().setIntParameter(
					HttpConnectionParams.CONNECTION_TIMEOUT,
					DEFAULT_POST_REQUEST_TIMEOUT);
			client.getParams().setIntParameter(HttpConnectionParams.SO_TIMEOUT,
					DEFAULT_POST_REQUEST_TIMEOUT);

			HttpResponse httpResponse = client.execute(postMethod);
			// statusCode = httpResponse.getStatusLine().getStatusCode();

			result = retrieveInputStream(httpResponse.getEntity());
		} catch (Exception e) {
			Log.e(TAG, "postRequest: " + e.toString());
			throw new APIException(e);
		} finally {
			postMethod.abort();
		}
		// parseStatusCode(statusCode, url);
		return result;
	}

	/**
	 * Retrieve the input stream from the HTTP connection.
	 * 
	 * @param httpEntity
	 * @return String
	 */
	private String retrieveInputStream(HttpEntity httpEntity) {
		int length = (int) httpEntity.getContentLength();

		StringBuffer stringBuffer = new StringBuffer(length);

		try {
			InputStreamReader inputStreamReader = new InputStreamReader(
					httpEntity.getContent(), HTTP.UTF_8);
			char buffer[] = new char[length];
			int count;
			while ((count = inputStreamReader.read(buffer, 0, length - 1)) > 0) {
				stringBuffer.append(buffer, 0, count);
			}
		} catch (UnsupportedEncodingException e) {
			Log.e(TAG, e.toString());
		} catch (IllegalStateException e) {
			Log.e(TAG, e.toString());
		} catch (IOException e) {
			Log.e(TAG, e.toString());
		}
		return stringBuffer.toString();
	}

	/**
	 * Get the HTTP digest authentication. Uses Base64 to encode credentials.
	 * 
	 * @return String
	 */
	private String getCredentials() {
		return new String(Base64.encodeBytes((mLogin + ":" + mPassword)
				.getBytes()));
	}

	/**
	 * Parse the status code and throw appropriate exceptions when necessary.
	 * 
	 * @param code
	 * @param path
	 * @throws APIException
	 */
	/*
	 * private void parseStatusCode(int code, String path) throws APIException {
	 * switch (code) { case 200: case 304: break; case 401: throw new
	 * APIException(String.valueOf(code)); case 400: case 403: case 404: throw
	 * new APIException(String.valueOf(code)); case 500: case 502: case 503:
	 * throw new APIException(String.valueOf(code)); } }
	 */
	/**
	 * Parse the response code and throw appropriate exceptions when necessary.
	 * 
	 * @param code
	 * @param path
	 * @throws APIException
	 */
	private void parseResponseCode(JSONObject result) throws APIException {
		if (result != null) {
			String status = "";
			int code = 0;
			String message = "";
			try {
				status = result.has("status") ? result.getString("status")
						: status;
				code = result.has("response_code") ? result
						.getInt("response_code") : code;
				message = result.has("response_message") ? result
						.getString("response_message") : message;
			} catch (Exception e) {
				throw new APIException(e.toString());
			}
			if (status.equals("error")) {
				throw new APIException(code, message);
			} else if (!status.equals("success")) {
				throw new APIException("Empty response");
			}
		}
	}
}
