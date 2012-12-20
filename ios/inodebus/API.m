//
//  API.m
//  inodebus
//
//  Created by hidden on 11-10-16.
//  Copyright 2011年 nodebus.com. All rights reserved.
//

#import "API.h"
#import "SBJson.h"
#import "JSONData.h"
#import "UIDevice+IdentifierAddition.h"
//
//static const NSString *kRegisterClientUrl = @"http://127.0.0.1:3000/1/register_client";
//static const NSString *kDelClientUrl = @"http://127.0.0.1:3000/1/del_client";
//static const NSString *kMessagesUrl = @"http://127.0.0.1:3000/1/messages";

//static const NSString *kRegisterClientUrl = @"http://192.168.1.102:3000/1/register_client";
//static const NSString *kDelClientUrl = @"http://192.168.1.102:3000/1/del_client";
//static const NSString *kMessagesUrl = @"http://192.168.1.102:3000/1/messages";


static const NSString *kRegisterClientUrl = @"http://api.nodebus.com/1/register_client";
static const NSString *kDelClientUrl = @"http://api.nodebus.com/1/del_client";
static const NSString *kMessagesUrl = @"http://api.nodebus.com/1/messages";

static const NSInteger kCount = 20;

@interface API ()
-(NSArray *)parseMessages:(NSDictionary *)response;
-(void)reset;
-(void)handleRequest:(ASIHTTPRequest *)request;
@end

@implementation API

@synthesize delegate, messageFinished;


+(BOOL) IsPad {
#ifdef __IPHONE_3_2
    return UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad;
#else
    return NO;
#endif
}

+(NSString *)login {
    return [[NSUserDefaults standardUserDefaults] stringForKey:@"k_login"];
}

+(NSString *)password {
    return [[NSUserDefaults standardUserDefaults] stringForKey:@"k_password"];
}

+(NSString *)clientId {
    return [[UIDevice currentDevice] uniqueDeviceIdentifier];
}

+(NSString *)token {
    return [[NSUserDefaults standardUserDefaults] stringForKey:@"k_token"];
}

+(void)setToken:(NSString *)token{
    [[NSUserDefaults standardUserDefaults] setObject:token forKey:@"k_token"];
}

+ (bool) loggedIn {
    return [[NSUserDefaults standardUserDefaults] boolForKey:@"k_loggedIn"];
}

+(void)setUser:(NSString *)login password:(NSString*) password{
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    [defaults setObject:login forKey:@"k_login"];
    [defaults setObject:password forKey:@"k_password"];
}

+(void)clearUser{
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    [defaults removeObjectForKey:@"k_login"];
    [defaults removeObjectForKey:@"k_password"];
    [defaults setBool:NO forKey:@"k_loggedIn"];
}

+(NSError *)registerClient{
    ASIFormDataRequest *request = [ASIFormDataRequest requestWithURL:[NSURL URLWithString:(NSString *)kRegisterClientUrl]];
    [request setAuthenticationScheme:(NSString *)kCFHTTPAuthenticationSchemeBasic];
    
    [request setUsername:[self login]];
    [request setPassword:[self password]];
    [request setPostValue:[self clientId] forKey:@"id"];
    [request setPostValue:[self token] forKey:@"token"];
    [request setPostValue:@"ios" forKey:@"type"];
    NSString* version = [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleVersion"];
    NSString* name = [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleDisplayName"];
    [request setPostValue:[NSString stringWithFormat:@"%@ for ios %@", name, version] forKey:@"desc"];
    
    UIDevice *device = [UIDevice currentDevice];
        
    [request setPostValue:[NSString stringWithFormat:@"%@; %@ %@; %@", device.model, device.systemName, device.systemVersion, [[NSLocale currentLocale] localeIdentifier]] forKey:@"platform"];
    [request startSynchronous];
    NSError *error = nil;
    [self parseResponse:request withError:&error];
    if (!error) {
        [[NSUserDefaults standardUserDefaults] setBool:YES forKey:@"k_loggedIn"];
    }
    return error;
}

+(NSError *)delClient{
    if ([self loggedIn]) {
        ASIFormDataRequest *request = [ASIFormDataRequest requestWithURL:[NSURL URLWithString:(NSString *)kDelClientUrl]];
        [request setAuthenticationScheme:(NSString *)kCFHTTPAuthenticationSchemeBasic];
        
        [request setUsername:[self login]];
        [request setPassword:[self password]];
        [request setPostValue:[self clientId] forKey:@"id"];
        [request setPostValue:@"ios" forKey:@"type"];
        [request startSynchronous];
        NSError *error = nil;
        [self parseResponse:request withError:&error];
        [self clearUser];
        return error;
    }
    return nil;
}

+(NSDictionary *)parseResponse:(ASIHTTPRequest *)request withError:(NSError **)error{    
    NSString *str = [request responseString];
    if ([str length] > 0) {
        NSDictionary *response = [str JSONValue];
        if (response) {
            NSString *status = [JSONData stringValue:[response objectForKey:@"status"]];
            if ([status isEqualToString:@"error"]) {
                *error = [NSError errorWithDomain:@"APIDomain" code:[JSONData integerValue:[response objectForKey:@"response_code"]] userInfo:[NSDictionary dictionaryWithObject:[response objectForKey:@"response_message"] forKey:@"NSLocalizedDescription"]];
                return nil;
            }else if([status isEqualToString:@"success"]){
                return response;
            }
        }
    }
    *error =  [NSError errorWithDomain:@"APIDomain" code:0 userInfo:[NSDictionary dictionaryWithObject:NSLocalizedString(@"Connect error", @"") forKey:@"NSLocalizedDescription"]];
    return nil;
}

+(ASIHTTPRequest *)newRequest:(NSString *)url{
    ASIHTTPRequest *request = [ASIHTTPRequest requestWithURL:[NSURL URLWithString:url]];
    [request setAuthenticationScheme:(NSString *)kCFHTTPAuthenticationSchemeBasic];
    [request setUsername:[[self class] login]];
    [request setPassword:[[self class] password]];
    return request;
}


-(id)init{
    self = [super init];
    if (self) {
        [self reset];
    }
    return self;
}

-(void)dealloc{
    [self cancel];
    [super dealloc];
}

-(void)reset{
    messageFinished = NO;
    messagePage = 1;
    sinceMessageId = nil;
    maxMessageId = nil;
}

- (void)cancel{
    if (_request) {
        [_request cancel];
        _request.delegate = nil;
        _request = nil;
    }
}


-(void)getMessages{
    [self reset];
    NSString *str = [NSString stringWithFormat:@"%@?count=%u", (NSString *)kMessagesUrl, kCount];
    _state = 0;
    _request = [[self class] newRequest:str];
    _request.delegate = self;        
    [_request startAsynchronous];
}

-(void)getNewMessages{
    
    NSString *str = [NSString stringWithFormat:@"%@?count=%u", (NSString *)kMessagesUrl, kCount];
    str = [str stringByAppendingFormat:@"&since_id=%@", sinceMessageId];
    _state = sinceMessageId ? 1 : 0;
    _request = [[self class] newRequest:str];
    _request.delegate = self;
    [_request startAsynchronous];
}

-(void)getMoreMessages{
    messagePage++;
    NSString *str = [NSString stringWithFormat:@"%@?count=%u", (NSString *)kMessagesUrl, kCount];
    str = [str stringByAppendingFormat:@"&page=%u&max_id=%@", messagePage, maxMessageId];
    _state = 2;
    _request = [[self class] newRequest:str];
    _request.delegate = self;
    [_request startAsynchronous];
}

-(void)handleRequest:(ASIHTTPRequest *)request{
    _request = nil;
    if (_state == 0) {
        NSError *error = nil;
        NSDictionary *response = [[self class] parseResponse:request withError:&error];
        if (error) {
            if ([self.delegate respondsToSelector:@selector(api:didFailWithError:)]) {
                [self.delegate api:self didFailWithError:error];
            }
        }else{
            NSArray *messages = [self parseMessages:response];
            if([messages count] < kCount){
                messageFinished = YES;
            }
            if ([messages count] > 0) {
                Message *msg = [messages objectAtIndex:0];
                maxMessageId = msg.id;
                sinceMessageId = msg.id;
            }
            if ([self.delegate respondsToSelector:@selector(api:didFindMessages:)]) {
                [self.delegate api:self didFindMessages:messages];
            }
        }
    }   else if (_state == 1){
        NSError *error = nil;
        NSDictionary *response = [[self class] parseResponse:request withError:&error];
        if (error) {
            if ([self.delegate respondsToSelector:@selector(api:didFailWithError:)]) {
                [self.delegate api:self didFailWithError:error];
            }
        }else{
            NSArray *messages = [self parseMessages:response];
            if ([messages count] > 0) {
                Message *msg = [messages objectAtIndex:0];
                sinceMessageId = msg.id;
                if (!maxMessageId) {
                    maxMessageId = msg.id;
                    if([messages count] < kCount){
                        messageFinished = YES;
                    }
                }
            }
            if ([self.delegate respondsToSelector:@selector(api:didFindNewMessages:)]) {
                [self.delegate api:self didFindNewMessages:messages];
            }
        }
    } else if(_state == 2){
        NSError *error = nil;
        NSDictionary *response = [[self class] parseResponse:request withError:&error];
        if (error) {
            if ([self.delegate respondsToSelector:@selector(api:didFailWithError:)]) {
                [self.delegate api:self didFailWithError:error];
            }
        }else{
            NSArray *messages = [self parseMessages:response];
            if([messages count] < kCount){
                messageFinished = YES;
            }
            if ([self.delegate respondsToSelector:@selector(api:didFindMoreMessages:)]) {
                [self.delegate api:self didFindMoreMessages:messages];
            }
        }
    }
}

- (void)requestFinished:(ASIHTTPRequest *)request{
    [self handleRequest:request];
}

- (void)requestFailed:(ASIHTTPRequest *)request{
    [self handleRequest:request];
}

-(NSArray *)parseMessages:(NSDictionary *)response{
    NSMutableArray *messages = [NSMutableArray array];
    if (response && [[response objectForKey:@"response_data"] isKindOfClass:[NSArray class]]) {
        NSArray *entries = [response objectForKey:@"response_data"];
        for (NSDictionary* entry in entries) {
            Message* message = [[Message alloc] initWithDictionary:entry];
            [messages addObject:message];
            [message release];
        }
    }
    return messages;
}

@end
