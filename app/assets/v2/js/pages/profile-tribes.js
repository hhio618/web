/* eslint-disable no-loop-func */


const loadDynamicScript = (callback, url, id) => {
  const existingScript = document.getElementById(id);

  if (!existingScript) {
    const script = document.createElement('script');

    script.src = url;
    script.id = id;
    document.body.appendChild(script);

    script.onload = () => {
      if (callback)
        callback();
    };
  }

  if (existingScript && callback)
    callback();
};

(function($) {
  // doc ready
  $(() => {
    Vue.component('tribes-profile-header', {
      delimiters: [ '[[', ']]' ],
      props: ['tribe'],
      data: () => ({
        isOnTribe: document.is_on_tribe
      }),
      methods: {
        followTribe: function (tribe, event) {
          event.preventDefault();
          let vm = this;

          const url = `/tribe/${tribe}/join/`;
          const sendJoin = fetchData(url, 'POST', {}, {'X-CSRFToken': vm.csrf});

          $.when(sendJoin).then((response) => {
            if (response && response.is_member) {
              vm.tribe.follower_count++;
              vm.isOnTribe = true;
            } else {
              vm.tribe.follower_count--;
              vm.isOnTribe = false;
            }
          }).fail((error) => {
            console.log(error);
          });
        }
      }
    });
    Vue.use(VueQuillEditor);
    window.tribesApp = new Vue({
      delimiters: [ '[[', ']]' ],
      el: '#tribes-vue-app',
      methods: {
        resetPreview: function() {
          this.headerFilePreview = null;
        },
        updateTribe: function() {
          let vm = this;
          const url = `/tribe/${vm.tribe.handle}/save/`;

          let data = new FormData();

          if (vm.$refs.quillEditorDesc) {
            data['tribe_description'] = vm.tribe.tribe_description;
          }

          if (vm.$refs.quillEditorPriority) {
            data.append('tribe_priority', vm.tribe.tribe_priority);
            data.append('priority_html_text', vm.$refs.quillEditorPriority.quill.getText(''));
          }

          if (vm.headerFile) {
            data.append('cover_image', vm.headerFile);
          }

          if (vm.params.publish_to_ts) {
            data.append('publish_to_ts', vm.params.publish_to_ts);
          }
          const sendSave = async(url, data) => {
            return $.ajax({
              type: 'POST',
              url: url,
              processData: false,
              contentType: false,
              data: data,
              headers: {'X-CSRFToken': vm.csrf}
            });
          }

          $.when(sendSave(url, data)).then(function(response) {
            _alert('Tribe has been updated');
            vm.tribe.tribes_cover_image = vm.headerFilePreview;
            vm.$bvModal.hide('change-tribe-header');
          }).fail(function(error) {
            _alert('Error saving priorites. Try again later', 'error');
            console.error('error: unable to save priority', error);
          });
        },
        tabChange: function(input) {
          let vm = this;

          switch (input) {
            default:
            case 0:
              newPathName = 'townsquare';
              break;
            case 1:
              newPathName = 'projects';
              break;
            case 2:
              newPathName = 'people';
              break;
            case 3:
              newPathName = 'chat';
              break;
          }
          let newUrl = `/${vm.tribe.handle}/${newPathName}${window.location.search}`;

          history.pushState({}, `Tribe - @${vm.tribe.handle}`, newUrl);
        },
        onEditorBlur(quill) {
          console.log('editor blur!', quill)
        },
        onEditorFocus(quill) {
          console.log('editor focus!', quill)
        },
        onEditorReady(quill) {
          console.log('editor ready!', quill)
        }
      },
      computed: {
        editorDesc() {
          return this.$refs.quillEditorDesc.quill
        },
        editorPriority() {
          return this.$refs.quillEditorPriority.quill
        },
      },
      mounted() {
        console.log('we mounted');
        let vm = this;
        this.$watch('headerFile', function(newVal, oldVal) {
          if (checkFileSize(this.headerFile, 4000000) === false) {
            _alert(`Profile Header Image should not exceed ${(4000000 / 1024 / 1024).toFixed(2)} MB`, 'error');
          } else {
            let reader = new FileReader();

            reader.onload = function(e) {
              vm.headerFilePreview = e.target.result;
              $('#preview').css('width', '100%');
              $('#js-drop span').hide();
              $('#js-drop input').css('visible', 'invisible');
              $('#js-drop').css('padding', 0);
            };
            reader.readAsDataURL(this.headerFile);
          }
        }, {deep: true});
      },
      data: function() {
        return $.extend({
          chatURL: document.chatURL || 'https://chat.gitcoin.co/',
          activePanel: document.activePanel,
          tribe: document.currentProfile
        }, {
          csrf: $("input[name='csrfmiddlewaretoken']").val(),
          headerFile: null,
          headerFilePreview: null,
          is_my_org: true,
          params: {
            publish_to_ts: false
          },
          editorOptionPrio: {
            modules: {
              toolbar: [
                [ 'bold', 'italic', 'underline' ],
                [{ 'align': [] }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [ 'link', 'code-block' ],
                ['clean']
              ]
            },
            theme: 'snow',
            placeholder: 'List out your tribe priorities to let contributors to know what they can request to work on'
          },
          editorOptionDesc: {
            modules: {
              toolbar: [
                [ 'bold', 'italic', 'underline' ],
                [{ 'align': [] }],
                [ 'link', 'code-block' ],
                ['clean']
              ]
            },
            theme: 'snow',
            placeholder: 'Describe your tribe so that people can follow you.'
          }
        });
      }
    });
  });

})(jQuery);
