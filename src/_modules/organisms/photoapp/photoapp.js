'use strict';

import { API_KEY, iOS } from '../../../_assets/eyeseeit/js/_helper';

export default class Photoapp {
    constructor() {
        if ($('.photoapp').length) {
            const self = this,
                VIDEO = document.getElementById('video'),
                POLAROID = document.getElementsByClassName('photoapp__polaroid')[0],
                CANVAS = document.getElementsByClassName('photoapp__canvas')[0],
                CONTEXT = CANVAS.getContext('2d'),
                VIDEOCONSTRAINTS = {
                    facingMode: 'environment'
                },
                CONSTRAINTS = {
                    video: VIDEOCONSTRAINTS,
                    audio: false
                };

            let pixelRatio = window.devicePixelRatio || 1;

            self.CANVAS = CANVAS;
            self.MESSAGE = document.getElementsByClassName('photoapp__message')[0];
            self.VIEWER = document.getElementsByClassName('photoapp__viewer')[0];
            self.CAMERA = document.getElementsByClassName('photoapp__btn -camera')[0];
            self.DETAILS = document.getElementsByClassName('photoapp__details')[0];


            CONTEXT.scale(pixelRatio, pixelRatio);
            VIDEO.setAttribute('playsinline', '');
            VIDEO.setAttribute('muted', '');

            navigator.mediaDevices
                .getUserMedia(CONSTRAINTS)
                .then(stream => {
                    VIDEO.srcObject = stream;
                    return navigator.mediaDevices.enumerateDevices();
                })
                .catch(error => {
                    console.error(error);
                    self.MESSAGE.textContent = error;
                });

            VIDEO.addEventListener('loadedmetadata', (e) => {
                e.currentTarget.width = e.currentTarget.videoWidth;
                e.currentTarget.height = e.currentTarget.videoHeight;

                CANVAS.width = e.currentTarget.width;
                CANVAS.height = e.currentTarget.height;
            }, false);

            if (document.getElementsByClassName('js-take-photo').length) {
                document.getElementsByClassName('js-take-photo')[0].addEventListener('click', () => {
                    CONTEXT.drawImage(video, 0, 0, VIDEO.width, VIDEO.height);

                    let imgDataURL = self.CANVAS.toDataURL('image/png');

                    POLAROID.style.backgroundImage = `url(${imgDataURL})`;

                    self.MESSAGE.textContent = 'analysing image';
                    self.VIEWER.classList.add('-show');
                    self.CAMERA.classList.add('-hide');

                    const request = new XMLHttpRequest();
                    request.open('POST', 'https://australiaeast.api.cognitive.microsoft.com/vision/v1.0/describe?maxCandidates=1', true);

                    // request.setRequestHeader('Content-Type', 'application/json');
                    request.setRequestHeader('Content-Type', 'application/octet-stream');
                    request.setRequestHeader('Ocp-Apim-Subscription-Key', API_KEY);

                    request.onload = function () {
                        console.log(request)
                        if (request.status >= 200 && request.status < 400) {
                            // Success!
                            let response = JSON.parse(request.response);
                            let description = response.description.captions[0].text;

                            self.MESSAGE.textContent = description;
                            self.speak('en-US', 'native', description);
                        }
                    };

                    request.onerror = function (err) {
                        // There was a connection error of some sort
                        self.MESSAGE.textContent = 'oops! something went wrong';
                        console.warn('ERROR');
                        console.log(err);
                    };

                    CANVAS.toBlob(function(blob){
                        request.send(blob);
                    }, 'image/png', 1);
                });
            }

            document.getElementsByClassName('js-delete-photo')[0].addEventListener('click', () => {
                self.reset();
            });
        }
    }

    unknownImage() {
        const self = this;

        self.MESSAGE.textContent = 'unknown image';
        self.speak('en-US', 'native', 'Sorry, can\'t determine the image.');
    }

    checkForVowel(str) {
        let firstLetter = str.charAt(0);

        if (firstLetter.match(/[aeiouAEIOU]/)) {
            return ' an ';
        } else {
            return ' a ';
        }
    }

    reset() {
        const self = this;

        self.MESSAGE.textContent = '';
        self.VIEWER.classList.remove('-show');
        self.CAMERA.classList.remove('-hide');
        document.getElementsByClassName('photoapp__polaroid')[0].setAttribute('style', '');
    }

    speak(newLang, newVoice, string) {
        let self = this;

        self.canITalk();

        // Create a new instance of SpeechSynthesisUtterance.
        let msg = new SpeechSynthesisUtterance();

        // Set the text.
        msg.text = string;

        msg.volume = 1; // 0 to 1
        msg.rate = 1; // 0.1 to 10
        msg.pitch = 1; //0 to 2

        // Set the language
        msg.lang = newLang;


        // If a voice has been selected, find the voice and set the
        // utterance instance's voice attribute.
        msg.voice = speechSynthesis.getVoices().filter(function (voice) {
            return voice.name == newVoice;
            // native
            // Google Deutsch
            // Google US English
            // Google UK English Female
            // Google UK English Male
            // Google español
            // Google español de Estados Unidos
            // Google français
            // Google हिन्दी
            // Google Bahasa Indonesia
            // Google italiano
            // Google 日本語
            // Google 한국의
            // Google Nederlands
            // Google polski
            // Google português do Brasil
            // Google русский
            // Google 普通话（中国大陆）
            // Google 粤語（香港）
            // Google 國語（臺灣）
        })[0];


        window.speechSynthesis.speak(msg);

        // msg.onend = function(e) {
        //     console.log('Finished in ' + event.elapsedTime + ' seconds.');
        // };
    }

    canITalk() {
        if (iOS()) {
            return false;
        }

        let SpeechSynthesisUtterance = window.webkitSpeechSynthesisUtterance
            || window.mozSpeechSynthesisUtterance
            || window.msSpeechSynthesisUtterance
            || window.oSpeechSynthesisUtterance
            || window.SpeechSynthesisUtterance;

        if (SpeechSynthesisUtterance === undefined) {
            return false;
        }
    }

    binEncode(data) {
        let binArray = []
        let datEncode = "";

        for (let i = 0; i < data.length; i++) {
            binArray.push(data[i].charCodeAt(0).toString(2));
        }

        for (let j = 0; j < binArray.length; j++) {
            let pad = padding_left(binArray[j], '0', 8);
            datEncode += pad + ' ';
        }

        function padding_left(s, c, n) {
            if (!s || !c || s.length >= n) {
                return s;
            }
            let max = (n - s.length) / c.length;
            for (let i = 0; i < max; i++) {
                s = c + s;
            } return s;
        }

        return binArray;
    }
}
