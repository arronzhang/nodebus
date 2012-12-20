//
//  inodebusAppDelegate.m
//  inodebus
//
//  Created by hidden on 11-9-27.
//  Copyright 2011年 nodebus.com. All rights reserved.
//

#import "inodebusAppDelegate.h"
#import "API.h"


@implementation inodebusAppDelegate


@synthesize window=_window;
@synthesize navigationController=_navigationController;


// TODO: Alert when notification disable, link to settings app

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
    //Notification
    [[UIApplication sharedApplication] registerForRemoteNotificationTypes:
     (UIRemoteNotificationTypeBadge | UIRemoteNotificationTypeSound | UIRemoteNotificationTypeAlert)];

    if(![[UIApplication sharedApplication] enabledRemoteNotificationTypes])
    { 
        NSLog(@"disable");
    }
    
    // Override point for customization after application launch.
    if ([self.window respondsToSelector:@selector(setRootViewController)]){
        self.window.rootViewController = self.navigationController;
    }else{
        [self.window addSubview:self.navigationController.view];
    }
    [self.window makeKeyAndVisible];
    return YES;
}

- (void)applicationWillResignActive:(UIApplication *)application
{
    /*
     Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
     Use this method to pause ongoing tasks, disable timers, and throttle down OpenGL ES frame rates. Games should use this method to pause the game.
     */
}

- (void)applicationDidEnterBackground:(UIApplication *)application
{
    /*
     Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later. 
     If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
     */
}

- (void)applicationWillEnterForeground:(UIApplication *)application
{
    /*
     Called as part of the transition from the background to the inactive state; here you can undo many of the changes made on entering the background.
     */
}

- (void)applicationDidBecomeActive:(UIApplication *)application
{
    [application setApplicationIconBadgeNumber:0];
    /*
     Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
     */
}

- (void)applicationWillTerminate:(UIApplication *)application
{
    /*
     Called when the application is about to terminate.
     Save data if appropriate.
     See also applicationDidEnterBackground:.
     */
}

// Delegation methods
- (void)application:(UIApplication *)app didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)devToken {
//    const void *devTokenBytes = [devToken bytes];
    NSString *token = [[devToken description] stringByTrimmingCharactersInSet:[NSCharacterSet characterSetWithCharactersInString:@"<>"]];
    token = [[token description] stringByReplacingOccurrencesOfString:@" " withString:@""];//去掉中间空格
    if ([token length] > 0) {
        [API setToken:token];
    }
    NSLog(@"deviceToken: %@", [API token]);
}

// TODO: Notify user for register client error

- (void)application:(UIApplication *)app didFailToRegisterForRemoteNotificationsWithError:(NSError *)err {
    NSLog(@"Error in registration. Error: %@", err);
}

//接收到push消息
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo {
    [[NSNotificationCenter defaultCenter] postNotificationName:@"receiveMessage" object:userInfo];
    //NSLog(@"收到推送消息 ： %@",userInfo);
//    UIAlertView* alert = [[UIAlertView alloc] initWithTitle:@"推送通知" 
//                                                    message:[[userInfo objectForKey:@"aps"] objectForKey:@"alert"]
//                                                   delegate:self
//                                          cancelButtonTitle:@"关闭"
//                                          otherButtonTitles:@"更新状态",nil];
//    [alert show];
//    [alert release];
}

- (void)dealloc
{
    [_window release];
    [_navigationController release];
    [super dealloc];
}

@end
