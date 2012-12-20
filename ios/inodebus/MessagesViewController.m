//
//  MessagesViewController.m
//  inodebus
//
//  Created by hidden on 11-10-16.
//  Copyright 2011年 nodebus.com. All rights reserved.
//

#import "MessagesViewController.h"

@interface UIAlertView (SPI)
- (void) addTextFieldWithValue:(NSString *) value label:(NSString *) label;
- (void) addTextFieldAtIndex:(NSUInteger) index;
- (UITextField *) textFieldAtIndex:(NSUInteger) index;
@end

@interface MessagesViewController ()
-(void)getNewMessages;
-(void)showErrorNotice;
-(void)signupFromButton;
- (void)deselectActiveRow;
@end

@implementation MessagesViewController

@synthesize api = _api, messages = _messages;

- (id)initWithStyle:(UITableViewStyle)style
{
    self = [super initWithStyle:style];
    if (self) {
        // Custom initialization
    }
    return self;
}

- (void)dealloc
{
    [_api release];
    [_messages release];
    [super dealloc];
}

- (void)didReceiveMemoryWarning
{
    // Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
    
    // Release any cached data, images, etc that aren't in use.
}

#pragma mark - View lifecycle

- (void)viewDidLoad
{
    [super viewDidLoad];
    _api = [[API alloc] init];
    _api.delegate = self;
    _messages = [[NSMutableArray alloc] init];
    self.tableView.rowHeight = 50;//Default 44
    [self initLogin];
    
    textPull = NSLocalizedString(@"Pull down to refresh...", @"Pull down to refresh...");
    textRelease = NSLocalizedString(@"Release to refresh...", @"Release to refresh...");
    textLoading = NSLocalizedString(@"Loading...", @"Loading...");
    
    // Uncomment the following line to preserve selection between presentations.
    // self.clearsSelectionOnViewWillAppear = NO;
 
    // Uncomment the following line to display an Edit button in the navigation bar for this view controller.
    // self.navigationItem.rightBarButtonItem = self.editButtonItem;
}

- (void)viewDidUnload
{
    [super viewDidUnload];
    // Release any retained subviews of the main view.
    // e.g. self.myOutlet = nil;
}

- (void)deselectActiveRow{
    if ([self.tableView indexPathForSelectedRow]) {
        UITableViewCell *cell = [self.tableView cellForRowAtIndexPath:[self.tableView indexPathForSelectedRow]];
        if (cell) {
            cell.detailTextLabel.numberOfLines = 1;
        }
        [self.tableView deselectRowAtIndexPath:[self.tableView indexPathForSelectedRow] animated:YES];
    }
}

- (void)viewWillAppear:(BOOL)animated
{
    [super viewWillAppear:animated];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(getNewMessages) name: @"receiveMessage" object:nil];
}

- (void)viewDidAppear:(BOOL)animated
{
    [super viewDidAppear:animated];
}

- (void)viewWillDisappear:(BOOL)animated
{
    [super viewWillDisappear:animated];
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)viewDidDisappear:(BOOL)animated
{
    [super viewDidDisappear:animated];
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
    // Return YES for supported orientations
    return (interfaceOrientation == UIInterfaceOrientationPortrait);
}

#pragma mark - Table view data source

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    // Return the number of sections.
    return 1;
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath {
    // If our cell is selected, return double height 
    if ([_messages count] > indexPath.row) {
        Message *message = [_messages objectAtIndex:indexPath.row];

        NSUInteger pad = 20;

        CGFloat height = [message.text sizeWithFont:[UIFont systemFontOfSize:16]
                              constrainedToSize:CGSizeMake(tableView.frame.size.width - pad*2, 1000.0f)
                                  lineBreakMode:UILineBreakModeTailTruncation].height;
        
        if([[tableView indexPathForSelectedRow] isEqual:indexPath]) {
            //18px/b, 14px, 280px
            height += [message.msg sizeWithFont:[UIFont systemFontOfSize:14]
                                  constrainedToSize:CGSizeMake(tableView.frame.size.width - pad*2, 1000.0f)
                                      lineBreakMode:UILineBreakModeTailTruncation].height;
        } else if( [message.msg length] ) {
            height += 14;
        }
        return 30 + height;
    }
   
    return 60;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    // Return the number of rows in the section.
    NSUInteger count = [_messages count];
    return count > 0 && ![_api messageFinished] ? (count + 1) : count;
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    if (indexPath.row == [_messages count]) {
        //More button
        static NSString *moreCellIdentifier = @"moreCell";
        UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:moreCellIdentifier];
        if (cell == nil) {
            cell = [[[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:moreCellIdentifier] autorelease];
        }
        cell.detailTextLabel.numberOfLines = 1;
        cell.textLabel.text = NSLocalizedString(@"Load more", @"Load more");
        cell.textLabel.textColor = [UIColor blueColor];
        cell.textLabel.textAlignment = UITextAlignmentCenter;
        return cell;

    }else{
        static NSString *CellIdentifier = @"Cell";
        
        UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:CellIdentifier];
        if (cell == nil) {
            cell = [[[UITableViewCell alloc] initWithStyle:UITableViewCellStyleSubtitle reuseIdentifier:CellIdentifier] autorelease];
//            cell.detailTextLabel.numberOfLines = 2;
//            NSLog(@"cell %@", NSStringFromCGRect(cell.bounds));
        }
        // Configure the cell...
        Message *message = [_messages objectAtIndex:indexPath.row];
        cell.textLabel.text = message.text;
        cell.detailTextLabel.text = message.msg;
        cell.textLabel.font = [UIFont systemFontOfSize: 16];
        cell.textLabel.numberOfLines = 0;
        return cell;
    }
}

/*
// Override to support conditional editing of the table view.
- (BOOL)tableView:(UITableView *)tableView canEditRowAtIndexPath:(NSIndexPath *)indexPath
{
    // Return NO if you do not want the specified item to be editable.
    return YES;
}
*/

/*
// Override to support editing the table view.
- (void)tableView:(UITableView *)tableView commitEditingStyle:(UITableViewCellEditingStyle)editingStyle forRowAtIndexPath:(NSIndexPath *)indexPath
{
    if (editingStyle == UITableViewCellEditingStyleDelete) {
        // Delete the row from the data source
        [tableView deleteRowsAtIndexPaths:[NSArray arrayWithObject:indexPath] withRowAnimation:UITableViewRowAnimationFade];
    }   
    else if (editingStyle == UITableViewCellEditingStyleInsert) {
        // Create a new instance of the appropriate class, insert it into the array, and add a new row to the table view
    }   
}
*/

/*
// Override to support rearranging the table view.
- (void)tableView:(UITableView *)tableView moveRowAtIndexPath:(NSIndexPath *)fromIndexPath toIndexPath:(NSIndexPath *)toIndexPath
{
}
*/

/*
// Override to support conditional rearranging of the table view.
- (BOOL)tableView:(UITableView *)tableView canMoveRowAtIndexPath:(NSIndexPath *)indexPath
{
    // Return NO if you do not want the item to be re-orderable.
    return YES;
}
*/

#pragma mark - Table view delegate

- (void)tableView:(UITableView *)tableView didDeselectRowAtIndexPath:(NSIndexPath *)indexPath{
    if (indexPath.row == [_messages count]) {
    } else {
        UITableViewCell *cell = [tableView cellForRowAtIndexPath:indexPath];
        if (cell) {
            cell.detailTextLabel.numberOfLines = 1;
        }
    }
}


- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
    // Navigation logic may go here. Create and push another view controller.
    /*
     <#DetailViewController#> *detailViewController = [[<#DetailViewController#> alloc] initWithNibName:@"<#Nib name#>" bundle:nil];
     // ...
     // Pass the selected object to the new view controller.
     [self.navigationController pushViewController:detailViewController animated:YES];
     [detailViewController release];
     */
    if (indexPath.row == [_messages count]) {
        //Load more
        [self deselectActiveRow];
        [_api getMoreMessages];
        [tableView deselectRowAtIndexPath:indexPath animated:YES];
    }else{
        UITableViewCell *cell = [tableView cellForRowAtIndexPath:indexPath];
        if (cell) {
            cell.detailTextLabel.numberOfLines = 0;
        }
        [tableView beginUpdates];
        [tableView endUpdates];
    }
}

#pragma mark - Messages

-(void)showMessages{
    [_api getMessages];
}

-(void)getNewMessages{
    if ([API loggedIn]) {
        [_api getNewMessages];
    }
}

- (void)refresh{
    if ([API loggedIn]) {
        [self deselectActiveRow];
        [_api getNewMessages];
    }else{
        [self stopLoading];
    }
}

#pragma mark -
#pragma mark APIDelegate

-(void)api:(API *)api didFindMessages:(NSArray *)messages{
//    NSLog(@"didFindMessages: %@", messages);
    [_messages addObjectsFromArray:messages];
    [self.tableView reloadData];
    [self stopLoading];
}

-(void)api:(API *)api didFindMoreMessages:(NSArray *)messages{
//    NSLog(@"didFindMoreMessages: %@", messages);
    [_messages addObjectsFromArray:messages];
    [self.tableView reloadData];
}

-(void)api:(API *)api didFindNewMessages:(NSArray *)messages{
//    NSLog(@"didFindNewMessages: %@", messages);
    [_messages insertObjects:messages atIndexes:[NSIndexSet indexSetWithIndexesInRange:NSMakeRange(0, [messages count])]];
    if ([_messages count] > 0) {
        NSMutableArray *ar = [NSMutableArray array];
        for (NSInteger i=0; i < [messages count]; i++) {
            [ar addObject:[NSIndexPath indexPathForRow:i inSection:0]];
        }
        [self.tableView insertRowsAtIndexPaths:ar withRowAnimation:UITableViewRowAnimationFade];
    }

//    [self.tableView reloadData];
    [self stopLoading];
}


-(void)api:(API *)api didFailWithError:(NSError *)error{
//    NSLog(@"didFailWithError: %@", error);
    [self stopLoading];
    [self showErrorNotice];
}


-(void) showErrorNotice{
    UIAlertView *alert = [[UIAlertView alloc] initWithTitle:NSLocalizedString(@"Error", @"Error") message:NSLocalizedString(@"Connect error. Please try again once you regain access.", @"Connect error") delegate:nil cancelButtonTitle:NSLocalizedString(@"Ok", @"Ok") otherButtonTitles:nil];
    [alert show];
    [alert release];
}

#pragma mark - Login

-(void)initLogin{
    [self refleshLoginButton];
    if ([API loggedIn]) {
        [self doLogin:NO];
    }else{
        [self showLoginView:[API login] notice:NSLocalizedString(@"Login notice", @"Register at nodebus.com")];
    }
}

- (void)refleshLoginButton{
    UIBarButtonItem *item;
    if ([API loggedIn]) {
        item = [[UIBarButtonItem alloc] initWithTitle:NSLocalizedString(@"Logout", @"Logout") style:UIBarButtonItemStyleBordered target:self action:@selector(logoutFromButton)];
        self.navigationItem.leftBarButtonItem = nil;
    }else{
        item = [[UIBarButtonItem alloc] initWithTitle:NSLocalizedString(@"Login", @"Login") style:UIBarButtonItemStyleBordered target:self action:@selector(loginFromButton)];
        UIBarButtonItem *lItem = [[UIBarButtonItem alloc] initWithTitle:NSLocalizedString(@"Signup", @"Signup") style:UIBarButtonItemStyleBordered target:self action:@selector(signupFromButton)];
        self.navigationItem.leftBarButtonItem = lItem;
        [lItem release];
    }
    self.navigationItem.rightBarButtonItem = item;
    [item release];
}

-(void)signupFromButton{
    [[UIApplication sharedApplication] openURL:[NSURL URLWithString:@"http://m.nodebus.com/signup"]];
}

-(void)loginFromButton{
    [self showLoginView:[API login] notice:nil];
}

-(void)logoutFromButton{
    UIActionSheet *_logoutActionSheet = [[UIActionSheet alloc] initWithTitle:nil
                                                     delegate:self
                                            cancelButtonTitle:NSLocalizedString(@"Cancel", @"")
                                       destructiveButtonTitle:NSLocalizedString(@"Logout", @"Logout")
                                            otherButtonTitles:
                          nil];
    if ([API IsPad]) {
        [_logoutActionSheet showFromBarButtonItem:self.navigationItem.rightBarButtonItem animated:YES];
    }else{
        [_logoutActionSheet showInView: self.view];
    }
    [_logoutActionSheet release]; 
}

-(void)showLoginView:(NSString *)username notice:(NSString *)notice{
    UIAlertView *_loginView = [[UIAlertView alloc] initWithTitle:NSLocalizedString(@"Login", @"Login")
                                            message:notice
                                           delegate:self
                                  cancelButtonTitle:NSLocalizedString(@"Cancel", @"Cancel")
                                  otherButtonTitles:NSLocalizedString(@"Login", @"Login"), nil];
    [_loginView addTextFieldWithValue:username label:NSLocalizedString(@"Username", @"Username")];
    [_loginView addTextFieldWithValue:@"" label:NSLocalizedString(@"Password", @"Password")];
    UITextField *name = [_loginView textFieldAtIndex:0];
    name.returnKeyType = UIReturnKeyNext;
    name.autocapitalizationType = UITextAutocapitalizationTypeNone;
    name.enablesReturnKeyAutomatically = YES;
    UITextField *pass = [_loginView textFieldAtIndex:1];
    [pass setSecureTextEntry:YES];
    //    pass.returnKeyType = UIReturnKeyDone;
    pass.returnKeyType = UIReturnKeyNext;
    pass.enablesReturnKeyAutomatically = YES;
    [_loginView show];
    [_loginView release];
}

-(void)doLogin:(bool)inView{
    if (![[API token] length]) {
        UIAlertView *alert = [[UIAlertView alloc] initWithTitle:nil message:NSLocalizedString(@"Fail to register remote notification", @"") delegate:nil cancelButtonTitle:NSLocalizedString(@"Ok", @"Ok") otherButtonTitles:nil];
        [alert show];
        [alert release];
        return;
    }
    bool loggedIn = [API loggedIn];
    NSError *error = [API registerClient];
    NSString *name = [API login];
    if (loggedIn != [API loggedIn]) {
        [self refleshLoginButton];
        loggedIn = [API loggedIn];
    }
    if (error) {
        NSString *msg = nil;
        if ([error code] > 1100) {
            msg = NSLocalizedString(@"Incorrect login or password", @"");
            [API clearUser];
            [self showLoginView:name notice:msg];
            if (loggedIn != [API loggedIn]) {
                [self refleshLoginButton];
            }
            return;
        }else if([error code] == 1100){
            msg = NSLocalizedString(@"System error", @"");
        }else{
            msg = NSLocalizedString(@"Connect error", @"");
        }
        if (inView) {
            [self showLoginView:name notice:msg];
        }else{
            [self showErrorNotice];
        }
    }else{
        [self showMessages];
    }
}


#pragma mark -
#pragma mark AlertViewControllerDelegate

- (void)alertView:(UIAlertView *)alertView clickedButtonAtIndex:(NSInteger)buttonIndex
{
	if (buttonIndex == 1) {
        NSString *name = [[alertView textFieldAtIndex:0] text];
        NSString *pass = [[alertView textFieldAtIndex:1] text];
//        NSLog(@"%@:%@:", name, pass);        
        if ([name length] == 0) {
            [self showLoginView:name notice:NSLocalizedString(@"Username is required", @"")];
        }else if([pass length] == 0){
            [self showLoginView:name notice:NSLocalizedString(@"Password is required", @"")];
        }else{
            [API setUser:name password:pass];
            [self doLogin:YES];
        }
	} else {
	}
}

#pragma mark -
#pragma mark UIActionSheetDelegate

- (void)actionSheet:(UIActionSheet*)actionSheet clickedButtonAtIndex:(NSInteger)buttonIndex {
    if (buttonIndex == 0) {
        //Logout
        [API delClient];
        [self refleshLoginButton];
    }
}

@end
