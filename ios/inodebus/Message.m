//
//  Message.m
//  inodebus
//
//  Created by hidden on 11-10-17.
//  Copyright 2011年 nodebus.com. All rights reserved.
//

#import "Message.h"
#import "JSONData.h"

@implementation Message

@synthesize id = _id, msg = _msg, type = _type, createdAt = _createdAt, uri = _uri, nodeName = _nodeName, nodeLogin = _nodeLogin, title = _title;

- (void) dealloc {
    [_id release];
    [_msg release];
    [_type release];
    [_createdAt release];
    [_uri release];
    [_nodeName release];
    [_nodeLogin release];
    [super dealloc];
}

- (Message *)initWithDictionary:(NSDictionary *)dictionary{
    self = [super init];
    if (self) {
        if (dictionary) {
            self.id = [JSONData stringValue:[dictionary valueForKey:@"id"]];
            self.msg = [JSONData stringValue:[dictionary valueForKey:@"msg"]];
            self.title = [JSONData stringValue:[dictionary valueForKey:@"title"]];
            self.type = [JSONData stringValue:[dictionary valueForKey:@"type"]];
            self.uri = [JSONData stringValue:[dictionary valueForKey:@"uri"]];
            self.nodeLogin = [JSONData stringValue:[dictionary valueForKey:@"nodeName"]];
            self.nodeName = [JSONData stringValue:[dictionary valueForKey:@"nodeLabel"]];
            self.createdAt = [JSONData dateValue:[dictionary valueForKey:@"createdAt"]];
        }
    }
    return self;
}

- (NSString *)createAtFormat{
    if (_createdAt) {
        NSDateFormatter *formatter;
        NSString        *dateString;
        formatter = [[NSDateFormatter alloc] init];
        [formatter setDateFormat:@"MM-dd HH:mm"];
//        [formatter setDateStyle:NSDateFormatterShortStyle];
        dateString = [formatter stringFromDate:_createdAt];
        [formatter release];
        return dateString;
    }
    return nil;
}

- (NSString *)text{
    return [NSString stringWithFormat:@"%@ %@", _nodeName, _title, nil];
}

@end
