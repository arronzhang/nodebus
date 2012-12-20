//
//  JSONData.h
//  airthings
//
//  Created by hidden on 11-8-22.
//  Copyright 2011年 zzdhidden@gmail.com . All rights reserved.
//



@interface JSONData : NSObject {
    
}

+(float) floatValue:(id)value;
+(NSInteger) integerValue:(id)value;
+(bool) boolValue:(id)value;
+(NSDate *)dateValue:(id)value;
+(NSString *)stringValue:(id)value;
+(NSDictionary *)dictionaryValue:(id)value;
+(NSArray *)arrayValue:(id)value;

@end
