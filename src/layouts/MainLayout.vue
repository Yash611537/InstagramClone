<template>
  <q-layout view="lHh Lpr lFf">
    <q-header bordered class="bg-white text-grey-10">
      <q-toolbar class="constrain">
        <q-btn
          flat
          to="/camera"
          round
          size="18px"
          dense
          class="large-screen-only q-mr-sm"
          icon="eva-camera-outline" />
        <q-separator
          vertical
          class="large-screen-only" />
        <q-toolbar-title class="text-grand-hotel text-bold">
          Instagram
        </q-toolbar-title>
        <q-btn
          flat
          to="/"
          round
          size="18px"
          class="large-screen-only"
          dense
          icon="eva-home-outline" />
      </q-toolbar>
    </q-header>

      <q-footer class="bg-white" >
          <transition
           appear
           enter-active-class="animated fadeIn"
           leave-active-class="animated fadeOut">
            <div
            v-if="showAppInstallBanner"
            class="banner-container bg-primary">
            <div class="constrain">
              <q-banner inline-actions dense class="bg-primary text-white">
                
                <template v-slot:avatar>
                  <q-avatar color="white" icon="eva-camera-outline" text-color="grey-10" font-size="22px" />
                </template>

                <b>Install Instagram?</b>

                <template v-slot:action>
                  <q-btn
                    flat
                    dense
                    @click="installApp"
                    class="q-px-sm"
                    label="Yes" />
                  <q-btn
                    flat
                    dense
                    @click="showAppInstallBanner = false"
                    class="q-px-sm"
                    label="Later" />
                  <q-btn
                    flat
                    dense
                    @click="neverShowAppInstallBanner"
                    class="q-px-sm"
                    label="Never" />
                </template>
              </q-banner>
            </div>
            </div>
          </transition>
          <q-tabs
            active-color="primary"
            indicator-color="transparent"
            class="text-grey-10 small-screen-only">
          <q-route-tab
            name="Home"
            to="/"
            icon="eva-home-outline"
            />
        <q-route-tab
            name="Camera"
            to="/camera"
            icon="eva-camera-outline"
            />
        </q-tabs>
      </q-footer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
let deferredPrompt;
export default {
  data() {
    return {
      showAppInstallBanner: false
    }
  },
  methods:{
    installApp(){
      
        // Hide the app provided install promotion
        this.showAppInstallBanner = false
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome == 'accepted') {
            console.log('User accepted the install prompt');
            this.neverShowAppInstallBanner()
          } else {
            console.log('User dismissed the install prompt');
          }
        })
    },
    neverShowAppInstallBanner() {
      this.showAppInstallBanner = false
      this.$q.localStorage.set('neverShowAppInstallBanner', true)
    }
  },
  mounted() {
    let neverShowAppInstallBanner = this.$q.localStorage.getItem('neverShowAppInstallBanner')

    if (!neverShowAppInstallBanner) {
      window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        // Update UI notify the user they can install the PWA
        setTimeout(() => {
          this.showAppInstallBanner = true
        }, 3000);
        
      });
    }
  }
}

</script>

<style lang="sass">
  .q-toolbar
     height: 77px
  .q-toolbar__title
    font-size:30px
    text-align: left
  .q-footer
    .q-tab__icon 
      font-size:30px 
    
</style>

