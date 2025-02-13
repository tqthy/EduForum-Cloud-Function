// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.
import * as functions from "firebase-functions";
// import * as admin from "firebase-admin";
import { getMessaging } from "firebase-admin/messaging";

import {
  createNewCommentNotificationFunction,
  createNewPostNotificationFunction,
} from "./notification/notification";
import {
  addTotalNewPostFunction,
  updateTotalCommentsAndRepliesFunction,
  updateTotalPostCreatedFunction,
  updateTotalPostDeletedFunction,
  updateTotalRepliesWhenCommentDeletedFunction,
} from "./post-comment/totalCount";
import {
  deleteAllPostSubcollectionFunction,
  deleteChildCommentAndVoteSubcollectionFunction,
} from "./post-comment/delete";
import {
  addLastModifiedToEditedCommentFunction,
  addLastModifiedToEditedPostFunction,
} from "./post-comment/timestamp";
import {
  addSampleCategoryFunction,
  addUserDefaultDepartmentFunction,
  createNewPostForUITCommunityFunction,
  createSubscriptionSubcollectionFunction,
} from "./community/community-setup";
import { updatePostAndCommentWhenCreatorUpdateProfileFunction } from "./post-comment/update";
import {
  approveAllUserRequestToJoinCommunityFunction,
  createNewPostWhenUserRequestToJoinCommunityFunction,
  updateMemberApprovalWhenUserUpdateProfileFunction,
} from "./community/memberApproval";
import {
  createCommunityFunction,
  getMemberInfoFunction,
  updateCommunityFunction,
} from "./community/community-http";
import {
  createCommentFunction,
  createPostFunction,
  updateCommentFunction,
  updatePostFunction,
} from "./post-comment/post-comment-http";
import { markAllNotificationAsReadFunction } from "./notification/notification-http";

// http function

// get member info of a community
export const getMemberInfo = functions.https.onCall(getMemberInfoFunction);
// create new community
export const createCommunity = functions.https.onCall(createCommunityFunction);
// update community
export const updateCommunity = functions.https.onCall(updateCommunityFunction);
// create new post
export const createPost = functions.https.onCall(createPostFunction);
// create new comment
export const createComment = functions.https.onCall(createCommentFunction);
// update post
export const updatePost = functions.https.onCall(updatePostFunction);
// update comment
export const updateComment = functions.https.onCall(updateCommentFunction);
// approve/reject all user requested to join community
export const approveAllUserRequestToJoinCommunity = functions.https.onCall(
  approveAllUserRequestToJoinCommunityFunction
);
// mark all notification as read
export const markAllNotificationAsRead = functions.https.onCall(
  markAllNotificationAsReadFunction
);

// background function

// create new post when user request to join community
export const createNewPostWhenUserRequestToJoinCommunity = functions.firestore
  .document("/Community/{communityID}/MemberApproval/{documentId}")
  .onCreate(createNewPostWhenUserRequestToJoinCommunityFunction);

// create new post for UIT community
export const createNewPostForUITCommunity = functions.firestore
  .document("/User/{userID}")
  .onCreate(createNewPostForUITCommunityFunction);

// send push notification
export const sendPushNotification = functions.firestore
  .document("/User/{userID}/Notification/{notificationID}")
  .onCreate(async (snapshot, context) => {
    const notificationData = snapshot.data();
    if (!notificationData) {
      console.log("No data in document! (Notification)");
      return;
    }
    const userID = context.params.userID;
    const topic = `user_${userID}`;

    let title = "Thông báo mới";
    let body = "Hãy kiểm tra thông báo mới của bạn.";
    if (notificationData.type === 1) {
      title = `Bình luận mới - ${notificationData.community.name}`;
      body = `${notificationData.triggeredBy.name} đã bình luận vào bài viết của bạn.`;
    } else if (notificationData.type === 2) {
      title = `Bài viết mới - ${notificationData.community.name}`;
      body = `${notificationData.triggeredBy.name} đã tạo bài viết mới trong cộng đồng bạn quan tâm.`;
    } else if (notificationData.type === 3) {
      title = `Bình luận mới - ${notificationData.community.name}`;
      body = `${notificationData.triggeredBy.name} đã trả lời bình luận của bạn.`;
    } else if (notificationData.type === 4) {
      title = `Thông báo mới - ${notificationData.community.name}`;
      body = `${notificationData.triggeredBy.name} đã tạo một thông báo mới.`;
    } else if (notificationData.type === 5) {
      title = `Bình luận mới - ${notificationData.community.name}`;
      body = `${notificationData.triggeredBy.name} đã bình luận vào bài viết bạn theo dõi.`;
    }

    // const payload = {
    //   notification: { title, body },
    //   topic: topic,
    //   data: {
    //     communityID: nofiticationData.community.communityID,
    //     postID: nofiticationData.post.postID,
    //   }
    // };
    const payload = {
      data: {
        title: title,
        body: body,
        communityID: notificationData.community.communityID,
        postID: notificationData.post.postID,
      },
      topic: topic
    };
    return getMessaging()
      .send(payload)
      .then((response) => {
        // Response is a message ID string.
        console.log("Successfully sent message:", response);
      })
      .catch((error) => {
        console.log("Error sending message:", error);
      });
  });

// create Notification for new comment
export const createNewCommentNotification = functions.firestore
  .document("/Community/{communityID}/Post/{postID}/Comment/{commentID}")
  .onCreate(createNewCommentNotificationFunction);

// create Notification when a new post is created
// MISSING: AUTO NOTIFY ADMIN FOR EVERY NEW POST
export const createNewPostNotification = functions.firestore
  .document("/Community/{communityID}/Post/{postID}")
  .onCreate(createNewPostNotificationFunction);

// add total new post in a community when a new post is created
export const addTotalNewPost = functions.firestore
  .document("/Community/{communityID}/Post/{postID}")
  .onCreate(addTotalNewPostFunction);

// update total replies, comments when a new comment is created
export const updateTotalCommentsAndReplies = functions.firestore
  .document("/Community/{communityID}/Post/{postID}/Comment/{commentID}")
  .onCreate(updateTotalCommentsAndRepliesFunction);

// update total replies when a comment is deleted
export const updateTotalRepliesWhenCommentDeleted = functions.firestore
  .document("/Community/{communityID}/Post/{postID}/Comment/{commentID}")
  .onDelete(updateTotalRepliesWhenCommentDeletedFunction);

// update total post when a new post is created
export const updateTotalPostCreated = functions.firestore
  .document("/Community/{communityID}/Post/{postID}")
  .onCreate(updateTotalPostCreatedFunction);

// update total post when a post is deleted
export const updateTotalPostDeleted = functions.firestore
  .document("/Community/{communityID}/Post/{postID}")
  .onDelete(updateTotalPostDeletedFunction);

// delete all comments and votes subcollection when a post is deleted
export const deleteAllPostSubcollection = functions.firestore
  .document("/Community/{communityID}/Post/{postID}")
  .onDelete(deleteAllPostSubcollectionFunction);

// delete all child comment and votes subcollection when a comment is deleted
export const deleteChildCommentAndVoteSubcollection = functions.firestore
  .document("/Community/{communityID}/Post/{postID}/Comment/{commentID}")
  .onDelete(deleteChildCommentAndVoteSubcollectionFunction);

// add createTime when a new Post is created
// export const addTimeCreatedToPost = functions.firestore
//   .document("/Community/{communityID}/Post/{postID}")
//   .onCreate(addTimeCreatedToPostFunction);

// add createTime when a new Comment is created
// export const addTimeCreatedToComment = functions.firestore
//   .document("/Community/{communityID}/Post/{postID}/Comment/{commentID}")
//   .onCreate(addTimeCreatedToCommentFunction);

// add lastModified when a post is edited
export const addLastModifiedToEditedPost = functions.firestore
  .document("/Community/{communityID}/Post/{postID}")
  .onUpdate(addLastModifiedToEditedPostFunction);

// add last modified when a comment is edited
export const addLastModifiedToEditedComment = functions.firestore
  .document("/Community/{communityID}/Post/{postID}/Comment/{commentID}")
  .onUpdate(addLastModifiedToEditedCommentFunction);

// add sample - announcement category everytime a new community is created
export const addSampleCategory = functions.firestore
  .document("/Community/{communityID}")
  .onCreate(addSampleCategoryFunction);

// add user to their default department
export const addUserDefaultDepartment = functions.firestore
  .document("/User/{documentId}")
  .onCreate(addUserDefaultDepartmentFunction);

// create empty subscription subcollection when new community is created
export const createSubscriptionSubcollection = functions.firestore
  .document("/Community/{communityID}")
  .onCreate(createSubscriptionSubcollectionFunction);

// generate invite code for communities
// export const generateCommunityCode = functions.firestore
//   .document("Community/{communityID}")
//   .onCreate(generateCommunityCodeFunction);

// update post and comment when creator update their profile picture, name, department
export const updatePostAndCommentWhenCreatorUpdateProfile = functions.firestore
  .document("/User/{userID}")
  .onUpdate(updatePostAndCommentWhenCreatorUpdateProfileFunction);

// update member approval when a user update their profile
export const updateMemberApprovalWhenUserUpdateProfile = functions.firestore
  .document("/User/{userID}")
  .onUpdate(updateMemberApprovalWhenUserUpdateProfileFunction);
