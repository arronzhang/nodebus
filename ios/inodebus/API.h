//
//  API.h
//  inodebus
//
//  Created by hidden on 11-10-16.
//  Copyright 2011年 nodebus.com. All rights reserved.
//

#import "ASIFormDataRequest.h"
#import "Message.h"

@protocol APIDelegate;

@interface API : NSObject<ASIHTTPRequestDelegate> {
    
    NSString *maxMessageId;
	NSString *sinceMessageId;
	NSInteger messagePage;
	bool messageFinished;
    id<APIDelegate> delegate;
    ASIHTTPRequest *_request;
    NSInteger _state;
}

@property (nonatomic, assign) id <APIDelegate> delegate;
@property (nonatomic, readonly) bool messageFinished;


+(BOOL) IsPad;
+ (NSString *) login;
+ (NSString *) password;
+ (bool) loggedIn;
+ (NSString *) clientId;
+ (NSString *) token;
+(void)setToken:(NSString *)token;


+(void)setUser:(NSString *)login password:(NSString*) password;
+(void)clearUser;
+(NSError *)registerClient;
+(NSError *)delClient;
+(NSDictionary *)parseResponse:(ASIHTTPRequest *)request withError:(NSError **)error;
+(ASIHTTPRequest *)newRequest:(NSString *)url;

- (void)cancel;
-(void)getMessages;
-(void)getMoreMessages;
-(void)getNewMessages;

@end

@protocol APIDelegate<NSObject>

-(void)api:(API*)api didFindMessages:(NSArray *)messages;
-(void)api:(API*)api didFindNewMessages:(NSArray *)messages;
-(void)api:(API*)api didFindMoreMessages:(NSArray *)messages;
-(void)api:(API*)api didFailWithError:(NSError *)error;

@end
