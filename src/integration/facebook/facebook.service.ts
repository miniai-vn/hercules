import { FacebookHttpService } from './facebook-http.service';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { FACEBOOK_CONFIG } from './config/facebook.config';
import { ChannelsService } from 'src/channels/channels.service';
import { ChannelType } from 'src/channels/dto/channel.dto';
import { TPageInfo } from './types/page.type';
import { FacebookTokenService } from './facebook-token.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FacebookUserProfileQueryDTO } from './dto/facebook.dto';

import { FacebookWebhookDTO } from './dto/facebook-webhook.dto';
import { CustomersService } from 'src/customers/customers.service';
import { TUserProfile } from './types/userProfile.type';
import { Platform } from 'src/customers/customers.dto';
import { ConversationsService } from 'src/conversations/conversations.service';
import { ConversationType } from 'src/conversations/conversations.entity';
import { ConversationMembersService } from 'src/conversation-members/conversation-members.service';
import { ParticipantType } from 'src/conversation-members/conversation-members.entity';
import { MessagesService } from 'src/messages/messages.service';

import { SenderType } from 'src/messages/messages.dto';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
dotenv.config();
Injectable();
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name);
  private readonly hubMode = 'subscribe';
  constructor(
    @Inject(forwardRef(() => ChannelsService))
    private readonly channelService: ChannelsService,

    @Inject(forwardRef(() => CustomersService))
    private readonly customerService: CustomersService,

    @Inject(forwardRef(() => ConversationsService))
    private readonly conversationService: ConversationsService,

    @Inject(forwardRef(() => ConversationMembersService))
    private readonly conversationMembersService: ConversationMembersService,

    @Inject(forwardRef(() => MessagesService))
    private readonly messagesService: MessagesService,

    @Inject(CACHE_MANAGER) private cacheManager: Cache,

    private readonly facebookHttpService: FacebookHttpService,
    private readonly facebookTokenService: FacebookTokenService,
  ) {}

  // Connect to facebook:
  async connectToFacebook(res: any): Promise<void> {
    const csrf = uuidv4();
    const statePayload = { csrf };
    const state = encodeURIComponent(JSON.stringify(statePayload));

    const fbAuthUrl = new URL(
      `${FACEBOOK_CONFIG.FACEBOOK_PATH}${FACEBOOK_CONFIG.ENDPOINT.DIALOG_OAUTH}`,
    );

    // fbAuthUrl.searchParams.append('response_type', 'token');
    fbAuthUrl.searchParams.append('display', 'popup');
    fbAuthUrl.searchParams.append('client_id', FACEBOOK_CONFIG.APP.ID);
    fbAuthUrl.searchParams.append('redirect_uri', FACEBOOK_CONFIG.REDIRECT_URL);
    fbAuthUrl.searchParams.append('scope', FACEBOOK_CONFIG.SCOPE);
    fbAuthUrl.searchParams.append('state', state);

    return res.redirect(fbAuthUrl.toString());
  }

  async callbackFacebook(code: string): Promise<string> {
    if (!code) {
      throw new InternalServerErrorException('Missing code in callback');
    }

    try {
      const tokenUser = await this.getLongLiveTokenUser(code);

      const pages = await this.getTokenPages(tokenUser);

      const tokenPage = pages.map((page) => {
        return {
          id: page.id,
          name: page.name,
          access_token: page.access_token,
          avatar: page.picture.data.url,
        };
      });

      for (const page of tokenPage) {
        const existingChannel = await this.channelService.getByTypeAndAppId(
          ChannelType.FACEBOOK,
          page.id,
        );

        if (existingChannel) {
          await this.channelService.update(existingChannel.id, {
            userToken: tokenUser,
            accessToken: page.access_token,
            name: page.name,
          });
        } else {
          await this.channelService.create({
            appId: page.id,
            name: page.name,
            accessToken: page.access_token,
            type: ChannelType.FACEBOOK,
            avatar: page.avatar,
            userToken: tokenUser,
          });
        }

        // *** GỌI ĐỒNG BỘ LỊCH SỬ TIN NHẮN TRONG VÒNG 3 THÁNG NGAY SAU KHI KẾT NỐI ***
        // Không cần await, để không block user (background)
        //   this.syncFacebookHistory(page.id, page.access_token)
        //     .then(() => {
        //       // Có thể log: Đồng bộ xong cho page.id
        //     })
        //     .catch((e) => {
        //       // Log lỗi đồng bộ nếu cần
        //       console.error('Sync Facebook history error', e);
        //     });
        //   // Nếu dùng queue/job: await this.queue.add('sync-facebook-history', { pageId: page.id, accessToken: page.access_token });
        // }
      }

      const idPage = tokenPage
        .map((page) => {
          return page.id;
        })
        .join(',');

      return `${process.env.DASHBOARD_BASE_URL}/dashboard/channels?type=facebook&appId=${idPage}`;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  private async getLongLiveTokenUser(code: string): Promise<string> {
    const endpoint = `${FACEBOOK_CONFIG.ENDPOINT.OAUTH_ACCESS_TOKEN}`;
    const params = {
      client_id: FACEBOOK_CONFIG.APP.ID,
      client_secret: FACEBOOK_CONFIG.APP.SECRET,
      redirect_uri: FACEBOOK_CONFIG.REDIRECT_URL,
      code,
    };

    try {
      const shortTokenResp = await this.facebookHttpService.callFacebookAPI(
        endpoint,
        'GET',
        params,
        undefined,
        FACEBOOK_CONFIG.BASE_PATH_FACEBOOK,
      );

      const shortLivedToken = shortTokenResp.data.access_token;

      if (!shortLivedToken) {
        throw new Error('No short-lived access_token in response');
      }

      const paramsLongLiveToken = {
        grant_type: 'fb_exchange_token',
        client_id: FACEBOOK_CONFIG.APP.ID,
        client_secret: FACEBOOK_CONFIG.APP.SECRET,
        fb_exchange_token: shortLivedToken,
      };

      // 2. Gọi tiếp để lấy long-lived token
      const longTokenResp = await this.facebookHttpService.callFacebookAPI(
        endpoint,
        'GET',
        paramsLongLiveToken,
        undefined,
        FACEBOOK_CONFIG.BASE_PATH_FACEBOOK,
      );

      const longLivedToken = longTokenResp.data.access_token;

      if (!longLivedToken) {
        throw new Error('No long-lived access_token in response');
      }

      return longLivedToken;
    } catch (error) {
      throw new Error(
        `Failed to exchange code for token: ${error.message || error}`,
      );
    }
  }

  private async getTokenPages(tokenUser: string): Promise<TPageInfo[]> {
    const url = `${FACEBOOK_CONFIG.BASE_PATH_FACEBOOK}/me/accounts`;

    try {
      const resp = await axios.get(url, {
        params: {
          access_token: tokenUser,
          fields: 'id,name,access_token,picture{url},tasks',
        },
      });

      return resp.data.data;
    } catch (error) {
      throw new Error(`Failed to get pages: ${error.message || error}`);
    }
  }

  async verifyWebhook(
    mode: string,
    token: string,
    challenge: string,
  ): Promise<string> {
    if (mode === this.hubMode && token === FACEBOOK_CONFIG.VERIFY_TOKEN) {
      return challenge;
    } else {
      throw new Error('Invalid verification token or mode');
    }
  }

  async handleWebhook(body: FacebookWebhookDTO): Promise<void> {
    if (body.object !== 'page') {
      throw new Error('IGNORED');
    }

    for (const entry of body.entry ?? []) {
      for (const event of entry.messaging) {
        if (event.message?.text) {
          await this.handleFacebookMessage(event);
        } else if (event.postback) {
          await this.handlePostback(event);
        }
      }
    }
  }

  private async handleFacebookMessage(event: any): Promise<void> {
    const psid = event.sender.id;
    const pageId = event.recipient.id;
    const message = event.message.text;

    // 1. Validate channel
    const channel = await this.channelService.getByTypeAndAppId(
      ChannelType.FACEBOOK,
      pageId,
    );

    if (!channel) {
      return;
    }

    // Get userIds from channel.user
    const userIds = channel.users.map((u) => u.id);

    // DONE: use to '@nestjs/cache-manager' of nestjs call api from facebook
    const query = {
      access_token: channel.accessToken,
      fields: 'first_name,last_name,profile_pic,name',
      psid: psid,
    };

    const resp = await this.getUserProfileWithCache(query);

    const customer = await this.customerService.findOrCreateByExternalId({
      platform: Platform.FACEBOOK,
      externalId: psid,
      shopId: channel.shop.id,
      channelId: channel.id,
      name: resp.name,
      avatar: resp.profile_pic,
    });

    // 4. Find or create conversation
    let conversation =
      await this.conversationService.findByCustomerIdAndChannelId(
        customer.id,
        channel.id,
      );

    if (!conversation) {
      await this.conversationService.create(
        {
          name: customer.name,
          avatar: customer.avatar,
          type: ConversationType.DIRECT,
          content: message,
          channelId: channel.id,
          externalId: psid,
          customerParticipantIds: [customer.id],
        },
        channel,
      );
    }
    // else {
    //   console.log('Found existing conversation:', conversation.id);

    //   await this.updateConversationThrottled(conversation.id, {
    //     content: message,
    //   });
    // }

    // TODO: 5. Nếu có nhiều user, dùng Promise.all để kiểm tra và thêm member song song
    // Chỉ dùng Promise.all nếu conversationMembersService không có side-effect/phụ thuộc thứ tự (vd: DB đảm bảo unique, không race condition)
    for (const userId of userIds) {
      const isMember =
        await this.conversationMembersService.isMemberOfConversation(
          conversation.id,
          ParticipantType.USER,
          userId,
        );

      if (!isMember) {
        await this.conversationMembersService.addParticipant(conversation.id, {
          participantType: ParticipantType.USER,
          userId,
          role: 'member',
          notificationsEnabled: true,
        });
      }
    }

    // 6. Add customer as member (check trước nếu cần)
    await this.conversationMembersService.addParticipant(conversation.id, {
      participantType: ParticipantType.CUSTOMER,
      customerId: customer.id,
      role: 'member',
      notificationsEnabled: true,
    });

    // 7. Lưu message
    await this.messagesService.create(
      {
        content: message,
        contentType: 'text',
        senderType: SenderType.customer,
        senderId: psid,
        conversationId: conversation.id,
      },
      conversation,
    );
  }

  async getUserInfoFromCustomer() {
    const infoUsers = await this.customerService.findByPlatform('facebook');

    return infoUsers.map((info) => {
      return {
        id: info.id,
        externalId: info.externalId,
        name: info.name,
        avatar: info.avatar,
      };
    });
  }

  // private async syncFacebookCustomer(event: any): Promise<void> {
  //   const psid = event.sender.id;
  //   const pageId = event.recipient.id; // page gửi/nhận tin

  //   const channel = await this.channelService.getByTypeAndAppId(
  //     ChannelType.FACEBOOK,
  //     pageId,
  //   );

  //   if (!channel?.accessToken) {
  //     throw new Error('Error accessToken');
  //   }

  //   try {
  //     const query = {
  //       access_token: channel.accessToken,
  //       fields: 'first_name,last_name,profile_pic,name',
  //       psid: psid,
  //     };

  //     const resp = await this.getUserProfile(query);

  //     // if (!resp) {
  //     //   continue;
  //     // }

  //     const existingCustomer =
  //       await this.customerService.findOrCreateByExternalId({
  //         platform: Platform.FACEBOOK,
  //         externalId: psid,
  //         shopId: channel.shop.id,
  //         channelId: channel.id,
  //       });
  //   } catch (error) {
  //     // Có thể log ra để sau này debug nếu cần
  //     throw new BadRequestException(
  //       `Bỏ qua psid ${psid} do lỗi:`,
  //       error?.message || error,
  //     );
  //     // continue;
  //   }
  // }

  // private async syncFacebookConversations(
  //   event: any,
  // ): Promise<Conversation | null> {
  //   const psid = event.sender.id;
  //   const pageId = event.recipient.id;

  //   // Lấy channel 1 lần
  //   const channel = await this.channelService.getByTypeAndAppId(
  //     ChannelType.FACEBOOK,
  //     pageId,
  //   );

  //   let after: string | undefined = undefined;
  //   let fbConv: TConversationPageId | undefined;

  //   do {
  //     const res = await this.getIdsConversationsPage({
  //       page_id: pageId,
  //       access_token_page: channel.accessToken,
  //       limit: 15,
  //       after,
  //     });

  //     const conversations = res.data || [];
  //     fbConv = conversations.find((conv) =>
  //       conv.participants.data.some((p: any) => p.id === psid),
  //     );

  //     if (fbConv) {
  //       break;
  //     }
  //     after = res.paging?.cursors?.after;
  //   } while (after);

  //   // Lấy participant là user (không phải page)
  //   const userParticipant = fbConv?.participants?.data?.find(
  //     (p: { id: string }) => p.id !== pageId,
  //   );

  //   // Lấy message hoặc content/snippet
  //   const hasMessage = !!event.message?.text || !!fbConv?.snippet;

  //   // Check bắt buộc: phải có customer participant và phải có message/content!
  //   if (!userParticipant) {
  //     console.warn(
  //       '[FacebookSync] Không tìm thấy customer participant, bỏ qua.',
  //     );
  //     return null;
  //   }
  //   if (!hasMessage) {
  //     console.warn(
  //       '[FacebookSync] Không có message hoặc snippet để sync conversation, bỏ qua.',
  //     );
  //     return null;
  //   }

  //   // Lấy userInfo/customer từ hệ thống
  //   let userInfo = null;
  //   if (userParticipant) {
  //     const allUserInfos = await this.getUserInfoFromCustomer();
  //     userInfo = allUserInfos.find(
  //       (u: { externalId: string }) => u.externalId === userParticipant.id,
  //     );
  //   }
  //   if (!userInfo) {
  //     // Optionally: tạo mới customer nếu muốn, hoặc bỏ qua tùy business
  //     console.warn(
  //       '[FacebookSync] Không mapping được userInfo với customer, bỏ qua.',
  //     );
  //     return null;
  //   }

  //   // Check lại conversation đã tồn tại chưa
  //   const existed = await this.conversationService.findByExternalId(fbConv.id);

  //   // Thêm member vào conversation nếu đủ điều kiện
  //   if (userInfo.id) {
  //     await this.handleConversationMember(
  //       existed ? existed.id : undefined,
  //       userInfo.id,
  //     );
  //   }

  //   // Tạo hoặc update conversation nếu đã có đủ điều kiện
  //   if (existed) {
  //     await this.conversationService.update(existed.id, {
  //       name: userInfo?.name ?? userParticipant?.name,
  //       type: ConversationType.DIRECT,
  //       externalId: fbConv.id,
  //       avatar: userInfo?.avatar ?? '',
  //       content: fbConv.snippet,
  //     });
  //     return existed;
  //   } else {
  //     const customerParticipantIds = userParticipant
  //       ? [userParticipant.id]
  //       : [];
  //     const createConversationDto: CreateConversationDto = {
  //       name: userInfo?.name ?? userParticipant?.name,
  //       type: ConversationType.DIRECT,
  //       content: fbConv.snippet ?? '',
  //       customerParticipantIds: customerParticipantIds,
  //       userParticipantIds: [],
  //       avatar: userInfo?.avatar ?? '',
  //       externalId: fbConv.id,
  //     };
  //     const newConversation = await this.conversationService.create(
  //       createConversationDto,
  //       channel,
  //     );
  //     return newConversation;
  //   }
  // }

  // private async handleConversationMember(
  //   conversationId: number,
  //   customerId: string,
  // ): Promise<ConversationMember> {
  //   return await this.conversationMembersService.addParticipant(
  //     conversationId,
  //     {
  //       participantType: ParticipantType.CUSTOMER,
  //       customerId: customerId,
  //       role: 'member',
  //       notificationsEnabled: true,
  //     },
  //   );
  // }

  // private conversationUpdateTimestamps = new Map<number, number>(); // conversationId -> last update timestamp ms

  // private async updateConversationThrottled(
  //   conversationId: number,
  //   updateDto: UpdateConversationDto,
  //   throttleMs = 10000, // 10 giây
  // ): Promise<ConversationResponseDto | null> {
  //   const now = Date.now();
  //   const lastUpdate =
  //     this.conversationUpdateTimestamps.get(conversationId) || 0;

  //   if (now - lastUpdate > throttleMs) {
  //     this.conversationUpdateTimestamps.set(conversationId, now);
  //     return await this.conversationService.update(conversationId, updateDto);
  //   } else {
  //     console.log(
  //       `Skipping update conversation ${conversationId} to avoid DB spam.`,
  //     );
  //     return null;
  //   }
  // }

  // Get ID conversation from page
  // private async getIdsConversationsPage(
  //   query: TFacebookConversatioQueryDTO & { limit?: number; after?: string },
  // ): Promise<{
  //   data: TConversationPageId[];
  //   paging?: { cursors?: { after?: string } };
  // }> {
  //   const { page_id, access_token_page, fields, limit, after } = query;
  //   const endpoint = `${page_id}/conversations`;
  //   const params: any = {
  //     access_token: access_token_page,
  //     fields:
  //       fields ??
  //       'id,participants,updated_time,snippet,messages.limit(1){message,from,created_time},tags',
  //   };
  //   if (limit) params.limit = limit;
  //   if (after) params.after = after;

  //   try {
  //     const response = await this.facebookHttpService.callFacebookAPI(
  //       endpoint,
  //       'GET',
  //       params,
  //       undefined,
  //       FACEBOOK_CONFIG.BASE_PATH_FACEBOOK,
  //     );

  //     // Trả về cả data và paging để phân trang phía ngoài
  //     return {
  //       data: response.data.data || [],
  //       paging: response.data.paging,
  //     };
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  // async getAllPsidsByPageId(
  //   pageId: string,
  //   accessToken: string,
  // ): Promise<string[]> {
  //   let psids: string[] = [];
  //   let endpoint = `${pageId}/conversations?fields=participants&access_token=${accessToken}`;

  //   while (endpoint) {
  //     const res = await this.facebookHttpService.callFacebookAPI(
  //       endpoint,
  //       'GET',
  //       undefined,
  //       undefined,
  //       FACEBOOK_CONFIG.BASE_PATH_FACEBOOK,
  //     );
  //     const data = res.data;
  //     for (const conv of data.data) {
  //       for (const p of conv.participants.data) {
  //         if (p.id !== pageId && !psids.includes(p.id)) {
  //           psids.push(p.id);
  //         }
  //       }
  //     }
  //     endpoint = data.paging?.next;
  //   }
  //   return psids;
  // }

  // async getIdsConversationsPageAll(): Promise<any> {
  //   const channels = await this.channelRepository.find({
  //     where: { type: ChannelType.FACEBOOK },
  //     select: ['id', 'userToken', 'name'],
  //   });

  //   const validTokens = channels
  //     .map((c) => c.userToken)
  //     .filter((token): token is string => !!token); // lọc null và undefined

  //   if (validTokens.length === 0) {
  //     throw new Error('Không tìm thấy userToken hợp lệ cho channel Facebook');
  //   }

  //   const userToken = validTokens[0];

  //   try {
  //     const pages = await this.getTokenPages(userToken);

  //     const response = await Promise.all(
  //       pages.map((page) =>
  //         this.getIdsConversationsPage({
  //           page_id: page.id,
  //           access_token_page: page.access_token,
  //         }).then((convs) => ({
  //           pageId: page.id,
  //           name: page.name,
  //           access_token: page.access_token,
  //           conversations: convs,
  //         })),
  //       ),
  //     );

  //     return response;
  //   } catch (error) {}
  // }

  // async getMessageDetail(
  //   query: FacebookMessageQueryDTO,
  // ): Promise<TFacebookMessage> {
  //   const { access_token, fields, id } = query;

  //   const endpoint = `${id}/messages`;
  //   const params = {
  //     access_token: access_token,
  //     fields: fields,
  //   };
  //   try {
  //     const response = await this.facebookHttpService.callFacebookAPI(
  //       endpoint,
  //       'GET',
  //       params,
  //       undefined,
  //       FACEBOOK_CONFIG.BASE_PATH_FACEBOOK,
  //     );
  //     return response.data.data;
  //   } catch (error) {
  //     throw new Error(`${error.message || error}`);
  //   }
  // }

  async getUserProfile(
    query: FacebookUserProfileQueryDTO,
  ): Promise<TUserProfile> {
    const { access_token, fields, psid } = query;
    const endpoint = psid;
    const params = {
      access_token: access_token,
      fields: fields,
    };

    try {
      const response = await this.facebookHttpService.callFacebookAPI(
        endpoint,
        'GET',
        params,
        undefined,
        FACEBOOK_CONFIG.BASE_PATH_FACEBOOK,
      );

      if (!response.data) {
        throw new Error('User not exist');
      }

      return response.data;
    } catch (error) {
      throw new Error(`${error.message || error}`);
    }
  }

  async handlePostback(event: any): Promise<void> {
    this.logger.log('This is postback');
    // const senderId = event.sender.id;
    // const payload = event.postback.payload;
    // console.log(`Received postback from ${senderId}: ${payload}`);
    // // Ví dụ trả về payload
    // await axios.post('https://graph.facebook.com/v23.0/me/messages', {
    //   recipient: { id: 'senderId' },
    //   message: {
    //     attachment: {
    //       type: 'template',
    //       payload: {
    //         template_type: 'button',
    //         text: 'Chọn một tùy chọn:',
    //         buttons: [
    //           {
    //             type: 'postback',
    //             title: 'Xem sản phẩm',
    //             payload: 'VIEW_PRODUCTS',
    //           },
    //           {
    //             type: 'postback',
    //             title: 'Liên hệ hỗ trợ',
    //             payload: 'CONTACT_SUPPORT',
    //           },
    //         ],
    //       },
    //     },
    //   },
    // });
  }

  async getUserProfileWithCache(
    query: FacebookUserProfileQueryDTO,
  ): Promise<TUserProfile> {
    const cacheKey = `fb:profile:${query.psid}`;
    let profile = await (this.cacheManager as any).get(cacheKey);

    if (profile) {
      return profile;
    }

    // Nếu chưa có trong cache thì gọi API thật
    profile = await this.getUserProfile(query);

    // Lưu vào cache (ttl mặc định lấy theo config)
    await (this.cacheManager as any).set(cacheKey, profile);

    return profile;
  }

  // async syncFacebookConversationsAndMessages(
  //   pageId: string,
  //   accessToken: string,
  // ) {
  //   const threeMonthsAgo = dayjs().subtract(3, 'month').toISOString();

  //   let nextConversationsUrl = `https://graph.facebook.com/v18.0/${pageId}/conversations?access_token=${accessToken}&fields=participants,updated_time,snippet,unread_count`;

  //   while (nextConversationsUrl) {
  //     const convRes = await axios.get(nextConversationsUrl);
  //     for (const conv of convRes.data.data) {
  //       if (conv.updated_time < threeMonthsAgo) continue;

  //       // Lấy participants, tạo hoặc tìm customer hệ thống
  //       for (const p of conv.participants.data) {
  //         // Tìm hoặc tạo customer (bằng externalId = p.id)
  //       }

  //       // Lấy messages của conversation
  //       let nextMessagesUrl = `https://graph.facebook.com/v18.0/${conv.id}/messages?access_token=${accessToken}&fields=message,from,created_time,attachments`;
  //       while (nextMessagesUrl) {
  //         const msgRes = await axios.get(nextMessagesUrl);
  //         for (const msg of msgRes.data.data) {
  //           if (msg.created_time < threeMonthsAgo) continue;
  //           // Lưu về bảng messages
  //         }
  //         nextMessagesUrl = msgRes.data.paging?.next;
  //       }
  //     }
  //     nextConversationsUrl = convRes.data.paging?.next;
  //   }
  // }

  /**
   * Chạy mỗi giờ: kiểm tra tất cả token Facebook page trong DB,
   * nếu gần hết hạn thì refresh và update lại.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleTokenExpiryCheck() {
    // 1. Lấy tất cả channel có type FACEBOOK từ DB
    const fbChannels = await this.channelService.findByType(
      ChannelType.FACEBOOK,
    );

    for (const channel of fbChannels) {
      const { id: channelId, accessToken } = channel;
      try {
        // 2. Kiểm tra xem token page có gần hết hạn không
        const isNearExpiry = await this.facebookTokenService.isTokenNearExpiry(
          accessToken,
          channelId,
        );

        if (isNearExpiry) {
          // 3. Refresh token và lưu lại DB
          const newToken =
            await this.facebookTokenService.refreshLongLivedToken(accessToken);

          await this.channelService.update(channelId, {
            accessToken: newToken,
          });
        }
      } catch (err) {
        throw new Error(`Error checking token expiry: ${err.message || err}`);
      }
    }

    return {
      messages: 'Facebook page tokens expiry check finished.',
    };
  }
}
