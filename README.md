# Installation

1. Clone the repository
   
2. Install dependencies

   ```bash
   npm install
   ```

3. Start the app

   ```bash
    npx expo start
   ```
Expo users and ask questions.

# Description

## CompostPal: A Mobile App for Sustainable Waste Disposal

My app provides sustainability education with a scanning and classification tool for waste items as well as a gamified tab where users can practice their recycling/composting knowledge daily. The waste scanning feature uses an on-device image recognition model and keyword matching to classify items into three categories: trash, recycle, or compost. The quiz tab provides a daily, multiple-choice quiz, where users can build a 'streak' of compost practice.

I was inspired by cameras placed had in front of some waste bins at MIT that sort items for you, and I thought, why not make a version that works for any trash can using a mobile app? I was also going through cleaning out my closet at the time, and found some unique rules regarding textile recycling for Massachusetts. I didn't actually know until a few months ago that not recycling textiles in Massachusetts was illegal. As such, I wanted to make an app with the goals of sustainability and education specifically for Massachusetts residents. 

Getting an image recognition model to run on the constrained hardware of mobile devices was the largest challenge. I had to carefully consider tradeoffs between accuracy and efficiency for the model to run on a phone. Additionally, I was new to React when I started programming, so learning how to use React specific language syntax while programming was another challenge.

I would add more daily games for users to practice with other than the multiple-choice quiz. For example, a matching or memory game. I would also add a history feature, so users can review their past scanned items and classifications to improve knowledge retention. Lastly, I would add a language choice option, ensuring the app is accessible to users of any background.

I learned that making apps can be a valuable way to contribute to my community and the broader world. I hope to use the skills I have developed in part from my participation in the challenge to make more apps in the future for social good. 
