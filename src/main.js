import Vue from 'vue'
import App from './App.vue'
import wx from "jweixin-module";
import router from './router'
// import store from './store'

Vue.prototype.$wx = wx;
Vue.config.productionTip = false;

if (process.env.NODE_ENV !== "production") {
  var VConsole = require("vconsole/dist/vconsole.min.js");
  new VConsole();
}

  new Vue({
    router,
    // store,
    render: (h) => h(App),
  }).$mount("#app");
