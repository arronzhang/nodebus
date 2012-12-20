//
//  Message.h
//  inodebus
//
//  Created by hidden on 11-10-17.
//  Copyright 2011年 nodebus.com. All rights reserved.
//

#import <Foundation/Foundation.h>


@interface Message : NSObject {
    NSString *_id;
    NSString *_msg;
    NSString *_title;
    NSString *_type;
    NSString *_uri;
    NSString *_nodeLogin;
    NSString *_nodeName;
    NSDate   *_createdAt;

}

@property (nonatomic, copy) NSString *id;
@property (nonatomic, copy) NSString *msg;
@property (nonatomic, copy) NSString *title;
@property (nonatomic, copy) NSString *type;
@property (nonatomic, copy) NSString *uri;
@property (nonatomic, copy) NSString *nodeLogin;
@property (nonatomic, copy) NSString *nodeName;
@property (nonatomic, retain) NSDate *createdAt;

@property (nonatomic, readonly) NSString *createAtFormat;
@property (nonatomic, readonly) NSString *text;


- (Message *)initWithDictionary:(NSDictionary *)dictionary;



@end
