<template>
<div id="app">
  <!--
      <div>{{openid}}</div>
    -->
  <div class="content">
    <div class="progress-bar">
      <div class="progress-value" :style="progressStyle"></div>
    </div>
    <div class="progress-number" v-if="progressStatus">加载中{{progressValue}}%</div>
    <div class="progress-number" v-else>加载失败,请退出重进</div>
  </div>
</div>
</template>

<script>
// TODO: 路由和vuex可能用不到,可以去掉
import axios from "axios";
const webURL = "https://apielb.jinlingkeji.cn/api/v23/";
//  const webURL = "https://lndxtest.jinlingkeji.cn/api/v23/";
// const webURL = "https://lndxpre.jinlingkeji.cn/api/v23/";
const JSAPIAPPID = "wxbd85dc45a5a84cd8"; //网上老年大学
const domainBaseUrl = 'https://authorization.jinlingkeji.cn'
export default {
  data() {
    return {
      progressStatus: true, //加载状态,true为正常
      progressValue: 0,
      toPage: "/page/vote/pages/voteIndex/voteIndex", //跳转去的小程序页面
      voteid: 0, //活动作品的id
      uid: 0, //用户id
      voteType: "", //voteIndex
      type: "", //签到入口
      timer: null
    };
  },
  created() {
    console.log(this.$route.query);
    this.timer = setInterval(() => {
      if (this.progressValue > 98) {
        clearInterval(this.timer);
        return
      }
      this.progressValue += 2;
    }, 1000);
    this.setData(this.$route.query);
    // let url = encodeURIComponent(window.location.href.split("#")[0]);
    this.getCode(); // 获取 code
  },
  beforeDestroy() {
    clearInterval(this.timer);
  },
  computed: {
    progressStyle() {
      return "width:" + this.progressValue + "%";
    }
  },
  methods: {
    setData(ops) {
      this.uid = ops.uid;
      if (ops.voteType) { //票选活动页面过来的
        this.voteType = ops.voteType;
        this.toPage = `/page/vote/pages/${ops.voteType}/${ops.voteType}`;
        this.voteid = ops.voteid || 0;
      }
      if (ops.type) { //活动字段识别
        this.type = ops.type
      }
    },
    getCode() {
      const searchParams = new URLSearchParams(window.location.search);
      const urlCode = searchParams.get("code");
      this.nowUrl = window.location.href
      if (!urlCode) {
        let STATE = {
          voteType: this.voteType,
          voteid: this.voteid,
          type: this.type,
          uid: this.uid,
        };
        STATE = JSON.stringify(STATE);
        const url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${JSAPIAPPID}&redirect_uri=${encodeURIComponent(
          `${domainBaseUrl}/#/`
        )}&response_type=code&scope=snsapi_base&connect_redirect=1&state=${STATE}#wechat_redirect`;
        window.location.replace(url);
      } else {
        let state = JSON.parse(searchParams.get("state"));
        this.progressValue = 51;
        this.setData(state);
        this.getOpenID(urlCode, this.uid);
      }
    },
    getOpenID(code, uid) {
      console.log("交换openid", code);
      let url = webURL + "schedule/getUserOpenid";
      let params = {
        code,
        uid
      };
      let encodeUrl = window.location.href.split("#")[0];
      axios
        .post(url, params, {
          headers: {
            "Content-Type": "application/json"
          }
        })
        .then(res => {
          console.log(res.data.data.openid);
          this.progressValue = 71;
          this.getJsConfig(encodeUrl, res.data.data.openid);
        })
        .catch(err => {
          console.log("公众号openid获取失败", err);
          this.progressStatus = false;
          clearInterval(this.timer)
        });
    },
    getJsConfig(url, openid) {
      let _this = this;
      let params = {
        url
      };
      axios
        .post(webURL + "schedule/getSignatur", params)
        .then(res => {
          _this.progressValue = 81;
          _this.$wx.config({
            debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
            appId: res.data.appid, // 必填，公众号的唯一标识
            timestamp: res.data.timestamp, // 必填，生成签名的时间戳
            nonceStr: res.data.nonceStr, // 必填，生成签名的随机串
            signature: res.data.signature, // 必填，签名
            jsApiList: [] // 必填，需要使用的JS接口列表
          });
          _this.$wx.ready(() => {
            if (openid) {
              _this.progressValue = 100;
              clearInterval(_this.timer)
              //获取openid之后去对应的页面
              if (_this.voteType != '') { //票选活动跳转页面
                _this.$wx.miniProgram.redirectTo({
                  url: _this.voteid ?
                    `${_this.toPage}?accounts_openid=${openid}&voteid=${_this.voteid}` : `${_this.toPage}?accounts_openid=${openid}`
                });
              } else if (_this.type != '') {
                if (_this.type == 'sign') { //签到入口的话,直接返回上一页
                  _this.$wx.miniProgram.navigateBack()
                }
              } else { //直播课表订阅消息跳转页面
                _this.$wx.miniProgram.redirectTo({
                  url: `/pages/education/education?liveType=wechatarticle&accounts_openid=${openid}`
                });
              }

            }
          });
        })
        .catch(err => {
          this.progressStatus = false;
          clearInterval(this.timer)
          console.log(err);
        });
    }
  }
};
</script>

<style lang="scss">
html,
body {
  margin: 0;
  padding: 0;
}

html {
  height: 100vh;
  width: 100%;
  background: url("~@/images/loading-bg.png") no-repeat;
  background-size: 100% 100%;
}

#app {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.progress-bar {
  width: 16.25rem
    /* 260/16 */
  ;
  height: 0.9375rem
    /* 15/16 */
  ;
  background: #ffd6d6;
  border-radius: 0.9375rem
    /* 15/16 */
  ;
  margin: auto;
  overflow: hidden;
}

.progress-value {
  width: 50%;
  height: 100%;
  background: #f21313;
}

.progress-number {
  width: 100%;
  text-align: center;
  margin-top: 0.9375rem
    /* 15/16 */
  ;
  height: 1.75rem
    /* 28/16 */
  ;
  font-size: 1.25rem
    /* 20/16 */
  ;
  font-family: PingFang-SC-Bold, PingFang-SC;
  font-weight: bold;
  color: #f21313;
  line-height: 1.75rem;
}
</style>
