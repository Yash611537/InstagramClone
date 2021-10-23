<template>
  <q-page class="constrain q-pa-md">
    <transition
      appear
      enter-active-class="animated fadeIn"
      leave-active-class="animated fadeOut">
      <div
      v-if="showNotificationsBanner && pushNotificationsSupported"
      class="banner-container bg-primary">
      <div class="constrain">
        <q-banner  class="bg-grey-3 q-mb-md">
          
          <template v-slot:avatar>
            <q-icon name="eva-bell-outline " color="primary " />
          </template>

          Would you like to enable notifications?

          <template v-slot:action>
            <q-btn
              flat
              color="primary"
              dense
              @click="enableNotifications"
              class="q-px-sm"
              label="Yes" />
            <q-btn
              flat
              color="primary"
              dense
              @click="showNotificationsBanner = false"
              class="q-px-sm"
              label="Later" />
            <q-btn
              flat
              color="primary"
              dense
              @click="neverShowNotificationsBanner"
              class="q-px-sm"
              label="Never" />
          </template>
        </q-banner>
      </div>
      </div>
    </transition>
    <div class="row q-col-gutter-lg">
      <div class="col-12 col-sm-8">
         <template v-if="!loadingPosts && posts.length">
            <q-card
              v-for="post in posts"
              :key="post.id"
              class="card-post q-mb-md"
              flat
             bordered>
              <q-item>
                <q-item-section avatar>
                  <q-avatar>
                    <img src="https://cdn.quasar.dev/img/boy-avatar.png">
                  </q-avatar>
                </q-item-section>

                <q-item-section>
                  <q-item-label class="text-bold">yaaashhh</q-item-label>
                  <q-item-label caption>
                    {{post.location}} 
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-separator />
              <q-img :src="post.imageUrl">  </q-img>

              <q-card-section>
                <div >{{ post.caption }}</div>
                <div class="text-caption text-grey" > {{ niceDate(post.date) }} </div>
              </q-card-section>
            </q-card>
         </template>
         <template v-else-if="!loadingPosts && !posts.length">
           <h5 class="text-center text-grey">No posts yet.</h5>
         </template>
         <template v-else>
             <div class="q-pa-md">
                <q-card flat bordered >
                  <q-item>
                    <q-item-section avatar>
                      <q-skeleton size="40px" type="QAvatar" animation="fade" />
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>
                        <q-skeleton type="text" animation="fade" />
                      </q-item-label>
                      <q-item-label caption>
                        <q-skeleton type="text" animation="fade" />
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-skeleton height="200px" square animation="fade" />

                  <q-card-section>
                    <q-skeleton type="text" class="text-subtitle2" animation="fade" />
                    <q-skeleton type="text" width="50%" class="text-subtitle2" animation="fade" />
                  </q-card-section>
                </q-card>
              </div>
         </template>
      </div>
      <div class="col-4 large-screen-only">
        <q-item class="fixed">
          <q-item-section avatar>
            <q-avatar size="48px">
              <img src="https://cdn.quasar.dev/img/boy-avatar.png">
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-bold">yaaashhh</q-item-label>
            <q-item-label caption>
              Yash Shah 
            </q-item-label>
          </q-item-section>
        </q-item>

      </div>
    </div>

    
  </q-page>
</template>

<script>
import { date } from 'quasar'
var qs = require('qs')
export default {
  name: 'PageHome',
  data(){
    return{
      posts: [],
      loadingPosts: false,
      showNotificationsBanner: false
    }
  },
  computed:{
    serviceWorkerSupoorted(){
      if ('serviceWorker' in navigator) return true
      return false
    },
    pushNotificationsSupported(){
      if ('PushManager' in window) return true
      return false       
    }
  },
  methods: {
    niceDate(value) {
      return date.formatDate(value, 'MMMM D h:mmA')
    },
    getPosts() {
      this.loadingPosts = true

      this.$axios.get(`${process.env.API}/posts`).then(response => {
        console.log('response: ', response)
        this.posts = response.data
        this.loadingPosts = false
      }).catch(err => {
        this.$q.dialog({
          title: 'Alert',
          message: 'Could not download your posts'
        })
        this.loadingPosts = false
      });

    },
    enableNotifications(){
      if (this.pushNotificationsSupported) {
        Notification.requestPermission(result => {
          console.log('result: ',result);
          this.neverShowNotificationsBanner()
          if (result == 'granted') {
            // this.displayGrantedNotification()
            this.checkForExistingPushSubscription()
          }
        })
      }
    },
    checkForExistingPushSubscription() {
      if (this.serviceWorkerSupoorted && this.pushNotificationsSupported) {
        let reg 
        navigator.serviceWorker.ready.then(swreg => {
          reg = swreg
          swreg.pushManager.getSubscription()
        }).then(sub => {
          if (!sub) {
            
            // console.log("Create a new push subsription");
            this.createPushSubscription(reg)
          }
        })
      }
    },
    createPushSubscription(reg) {
      let vapidPublicKey = 'BC5QIUBo-Pi68RkSKoiQS_PNYIT2XE-xGTK5ofR1cfR4RJ9TPgvmwsZNEB03dqW-BuZhzou4QabUWOEeLt42l8g'
      reg.pushManager.subscribe({
        applicationServerKey: vapidPublicKey,
        userVisibleOnly: true,
      }).then(newSub => {
        let newSubData = newSub.toJSON(),
            newSubDataQS = qs.stringify(newSubData)
        return this.$axios.post(`${process.env.API}/createSubscription?${ newSubDataQS }`)
      }).then(response =>{
        this.displayGrantedNotification()
      }).catch(err => {
        console.log("error", err);

      })
    },
    neverShowNotificationsBanner() {
      this.showNotificationsBanner = false
      this.$q.localStorage.set('neverShowNotificationsBanner', true)
    },
    initNotification() {
      let neverShowNotificationsBanner = this.$q.localStorage.getItem('neverShowNotificationsBanner')

      if (!neverShowNotificationsBanner) {
        this.showNotificationsBanner = true
      }      
    },
    
    displayGrantedNotification(){
      // new Notification("You're subscribed to instagram", {
      //   body: 'Thanks for subscribing',
      //   icon:  'icons/icon-128x128.png',
      //   image:  'icons/icon-128x128.png',
      //   badge:  'icons/icon-128x128.png',
      //   dir: 'ltr',
      //   lang: 'en-US',
      //   vibrate: [100, 50, 200],
      //   tag: 'confirm-notification',
      //   renotify: true 
      // })
      if (this.serviceWorkerSupoorted && this.pushNotificationsSupported) {
        navigator.serviceWorker.ready.then(swreg => {
          swreg.showNotification("You're subscribed to instagram", {
            body: 'Thanks for subscribing',
            icon:  'icons/icon-128x128.png',
            image:  'icons/icon-128x128.png',
            badge:  'icons/icon-128x128.png',
            dir: 'ltr',
            lang: 'en-US',
            vibrate: [100, 50, 200],
            tag: 'confirm-notification',
            renotify: true,
            actions:[
              {
                action: 'hello',
                title: 'Hello'
              },
              {
                action: 'goodbye',
                title: 'Goodbye'
              }
            ]
          })
        })
      }
    }
  },
  created(){
    this.getPosts()
    this.initNotification()
  }
}
</script>
<style lang="sass">
  .card-post
    .q-img
      min-height: 200px
</style>