//
//  MessagesViewController.h
//  inodebus
//
//  Created by hidden on 11-10-16.
//  Copyright 2011年 nodebus.com. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "API.h"
#import "PullRefreshTableViewController.h"


@interface MessagesViewController : PullRefreshTableViewController<UIAlertViewDelegate, UIActionSheetDelegate, APIDelegate> {
    API *_api;
    NSMutableArray *_messages;
}

@property (nonatomic, retain) API *api;
@property (nonatomic, retain) NSMutableArray *messages;


-(void)initLogin;
-(void)refleshLoginButton;
-(void)logoutFromButton;
-(void)loginFromButton;
-(void)showLoginView:(NSString *)username notice:(NSString *)notice;
-(void)doLogin:(bool)inView;

-(void)showMessages;

@end
