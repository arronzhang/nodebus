package com.nodebus.android;

/*
 * 
 *  "response_code": 0, "response_message": "Connect error" 
 *  "response_code": 1100, "response_message": "An error occurred" 
 *  "response_code": 1101, "response_message": "Invalid Credentials" 
 *  "response_code": 1102, "response_message": "Missing required parameters" 
 *  "response_code": 1103, "response_message": "No such user" 
 *  "response_code": 1104, "response_message": "No such node" 
 *  
 */

public class APIException extends Exception {

	private static final long serialVersionUID = 3072410275455642786L;
	/**
	 * Holds status code of HTTP Responses... 0 means "unknown"
	 */
	private final int statusCode;

	/**
	 * @param detailMessage
	 */
	public APIException(String detailMessage) {
		super(detailMessage);
		this.statusCode = 0;
	}

	public APIException(int statusCode, final String detailMessage) {
		super(detailMessage);
		this.statusCode = statusCode;
	}

	public int getStatusCode() {
		return this.statusCode;
	}

	/**
	 * @param throwable
	 */
	public APIException(Throwable throwable) {
		super(throwable);
		this.statusCode = 0;
	}

	/**
	 * @param detailMessage
	 * @param throwable
	 */
	public APIException(String detailMessage, Throwable throwable) {
		super(detailMessage, throwable);
		this.statusCode = 0;
	}

	@Override
	public String toString() {
		String str = super.toString();
		if (this.statusCode != 0) {
			str = Integer.toString(this.statusCode) + " " + str;
		}
		return str;
	}

}
