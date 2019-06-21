(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const months = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
const zeroPad = n => n < 10 ? '0' + n : n;

const RFC = function(date) {
  const day = days[date.getDay()].substring(0, 3);
  const paddedDate = zeroPad(date.getDate());
  const month = months[date.getMonth()].substring(0,3);
  const year = date.getFullYear().toString();
  const hours = date.getUTCHours().toString();
  const minutes = date.getUTCMinutes().toString();
  const seconds = date.getUTCSeconds().toString();
  return `${day}, ${paddedDate} ${month} ${year} ${hours}:${minutes}:${seconds} Z`;
};

const objectFromMap = function(map) {
  const object = Array.from(map).reduce((object, [key, value]) => (
    Object.assign(object, { [key]: value }) // Be careful! Maps can have non-String keys; object literals can't.
  ), {});
  return object;
};

const mapFromObject = function(object) {
  const map = new Map();
  for (var property in object) {
    if (object.hasOwnProperty(property)) {
      map.set(property, object[property]);
    }
  }
  return map;
};

class Author {

  // constructor(name='', personalURL='', affiliation='', affiliationURL='') {
  //   this.name = name; // 'Chris Olah'
  //   this.personalURL = personalURL; // 'https://colah.github.io'
  //   this.affiliation = affiliation; // 'Google Brain'
  //   this.affiliationURL = affiliationURL; // 'https://g.co/brain'
  // }

  constructor(object) {
    this.name = object.author; // 'Chris Olah'
    this.personalURL = object.authorURL; // 'https://colah.github.io'
    this.affiliation = object.affiliation; // 'Google Brain'
    this.affiliationURL = object.affiliationURL; // 'https://g.co/brain'
    this.affiliations = object.affiliations || []; // new-style affiliations
  }

  // 'Chris'
  get firstName() {
    const names = this.name.split(' ');
    return names.slice(0, names.length - 1).join(' ');
  }

  // 'Olah'
  get lastName() {
    const names = this.name.split(' ');
    return names[names.length -1];
  }
}

function mergeFromYMLFrontmatter(target, source) {
  target.title = source.title;
  if (source.published) {
    if (source.published instanceof Date) {
      target.publishedDate = source.published;
    } else if (source.published.constructor === String) {
      target.publishedDate = new Date(source.published);
    }
  }
  if (source.publishedDate) {
    if (source.publishedDate instanceof Date) {
      target.publishedDate = source.publishedDate;
    } else if (source.publishedDate.constructor === String) {
      target.publishedDate = new Date(source.publishedDate);
    } else {
      console.error('Don\'t know what to do with published date: ' + source.publishedDate);
    }
  }
  target.description = source.description;
  target.authors = source.authors.map( (authorObject) => new Author(authorObject));
  target.katex = source.katex;
  target.password = source.password;
  if (source.doi) {
    target.doi = source.doi;
  }
}

class FrontMatter {
  constructor() {
    this.title = 'unnamed article'; // 'Attention and Augmented Recurrent Neural Networks'
    this.description = ''; // 'A visual overview of neural attention...'
    this.authors = []; // Array of Author(s)

    this.bibliography = new Map();
    this.bibliographyParsed = false;
    //  {
    //    'gregor2015draw': {
    //      'title': 'DRAW: A recurrent neural network for image generation',
    //      'author': 'Gregor, Karol and Danihelka, Ivo and Graves, Alex and Rezende, Danilo Jimenez and Wierstra, Daan',
    //      'journal': 'arXiv preprint arXiv:1502.04623',
    //      'year': '2015',
    //      'url': 'https://arxiv.org/pdf/1502.04623.pdf',
    //      'type': 'article'
    //    },
    //  }

    // Citation keys should be listed in the order that they are appear in the document.
    // Each key refers to a key in the bibliography dictionary.
    this.citations = []; // [ 'gregor2015draw', 'mercier2011humans' ]
    this.citationsCollected = false;

    //
    // Assigned from posts.csv
    //

    //  publishedDate: 2016-09-08T07:00:00.000Z,
    //  tags: [ 'rnn' ],
    //  distillPath: '2016/augmented-rnns',
    //  githubPath: 'distillpub/post--augmented-rnns',
    //  doiSuffix: 1,

    //
    // Assigned from journal
    //
    this.journal = {};
    //  journal: {
    //    'title': 'Distill',
    //    'full_title': 'Distill',
    //    'abbrev_title': 'Distill',
    //    'url': 'http://distill.pub',
    //    'doi': '10.23915/distill',
    //    'publisherName': 'Distill Working Group',
    //    'publisherEmail': 'admin@distill.pub',
    //    'issn': '2476-0757',
    //    'editors': [...],
    //    'committee': [...]
    //  }
    //  volume: 1,
    //  issue: 9,

    this.katex = {};

    //
    // Assigned from publishing process
    //

    //  githubCompareUpdatesUrl: 'https://github.com/distillpub/post--augmented-rnns/compare/1596e094d8943d2dc0ea445d92071129c6419c59...3bd9209e0c24d020f87cf6152dcecc6017cbc193',
    //  updatedDate: 2017-03-21T07:13:16.000Z,
    //  doi: '10.23915/distill.00001',
    this.doi = undefined;
    this.publishedDate = undefined;
  }

  // Example:
  // title: Demo Title Attention and Augmented Recurrent Neural Networks
  // published: Jan 10, 2017
  // authors:
  // - Chris Olah:
  // - Shan Carter: http://shancarter.com
  // affiliations:
  // - Google Brain:
  // - Google Brain: http://g.co/brain

  //
  // Computed Properties
  //

  // 'http://distill.pub/2016/augmented-rnns',
  set url(value) {
    this._url = value;
  }
  get url() {
    if (this._url) {
      return this._url;
    } else if (this.distillPath && this.journal.url) {
      return this.journal.url + '/' + this.distillPath;
    } else if (this.journal.url) {
      return this.journal.url;
    }
  }

  // 'https://github.com/distillpub/post--augmented-rnns',
  get githubUrl() {
    if (this.githubPath) {
      return 'https://github.com/' + this.githubPath;
    } else {
      return undefined;
    }
  }

  // TODO resolve differences in naming of URL/Url/url.
  // 'http://distill.pub/2016/augmented-rnns/thumbnail.jpg',
  set previewURL(value) {
    this._previewURL = value;
  }
  get previewURL() {
    return this._previewURL ? this._previewURL : this.url + '/thumbnail.jpg';
  }

  // 'Thu, 08 Sep 2016 00:00:00 -0700',
  get publishedDateRFC() {
    return RFC(this.publishedDate);
  }

  // 'Thu, 08 Sep 2016 00:00:00 -0700',
  get updatedDateRFC() {
    return RFC(this.updatedDate);
  }

  // 2016,
  get publishedYear() {
    return this.publishedDate.getFullYear();
  }

  // 'Sept',
  get publishedMonth() {
    return months[this.publishedDate.getMonth()];
  }

  // 8,
  get publishedDay() {
    return this.publishedDate.getDate();
  }

  // '09',
  get publishedMonthPadded() {
    return zeroPad(this.publishedDate.getMonth() + 1);
  }

  // '08',
  get publishedDayPadded() {
    return zeroPad(this.publishedDate.getDate());
  }

  get publishedISODateOnly() {
    return this.publishedDate.toISOString().split('T')[0];
  }

  get volume() {
    const volume = this.publishedYear - 2015;
    if (volume < 1) {
      throw new Error('Invalid publish date detected during computing volume');
    }
    return volume;
  }

  get issue() {
    return this.publishedDate.getMonth() + 1;
  }

  // 'Olah & Carter',
  get concatenatedAuthors() {
    if (this.authors.length > 2) {
      return this.authors[0].lastName + ', et al.';
    } else if (this.authors.length === 2) {
      return this.authors[0].lastName + ' & ' + this.authors[1].lastName;
    } else if (this.authors.length === 1) {
      return this.authors[0].lastName;
    }
  }

  // 'Olah, Chris and Carter, Shan',
  get bibtexAuthors() {
    return this.authors.map(author => {
      return author.lastName + ', ' + author.firstName;
    }).join(' and ');
  }

  // 'olah2016attention'
  get slug() {
    let slug = '';
    if (this.authors.length) {
      slug += this.authors[0].lastName.toLowerCase();
      slug += this.publishedYear;
      slug += this.title.split(' ')[0].toLowerCase();
    }
    return slug || 'Untitled';
  }

  get bibliographyEntries() {
    return new Map(this.citations.map( citationKey => {
      const entry = this.bibliography.get(citationKey);
      return [citationKey, entry];
    }));
  }

  set bibliography(bibliography) {
    if (bibliography instanceof Map) {
      this._bibliography = bibliography;
    } else if (typeof bibliography === 'object') {
      this._bibliography = mapFromObject(bibliography);
    }
  }

  get bibliography() {
    return this._bibliography;
  }

  static fromObject(source) {
    const frontMatter = new FrontMatter();
    Object.assign(frontMatter, source);
    return frontMatter;
  }

  assignToObject(target) {
    Object.assign(target, this);
    target.bibliography = objectFromMap(this.bibliographyEntries);
    target.url = this.url;
    target.doi = this.doi;
    target.githubUrl = this.githubUrl;
    target.previewURL = this.previewURL;
    if (this.publishedDate) {
      target.volume = this.volume;
      target.issue = this.issue;
      target.publishedDateRFC = this.publishedDateRFC;
      target.publishedYear = this.publishedYear;
      target.publishedMonth = this.publishedMonth;
      target.publishedDay = this.publishedDay;
      target.publishedMonthPadded = this.publishedMonthPadded;
      target.publishedDayPadded = this.publishedDayPadded;
    }
    if (this.updatedDate) {
      target.updatedDateRFC = this.updatedDateRFC;
    }
    target.concatenatedAuthors = this.concatenatedAuthors;
    target.bibtexAuthors = this.bibtexAuthors;
    target.slug = this.slug;
  }

}

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const Mutating = (superclass) => {
  return class extends superclass {

    constructor() {
      super();

      // set up mutation observer
      const options = {childList: true, characterData: true, subtree: true};
      const observer = new MutationObserver( () => {
        observer.disconnect();
        this.renderIfPossible();
        observer.observe(this, options);
      });

      // ...and listen for changes
      observer.observe(this, options);
    }

    connectedCallback() {
      super.connectedCallback();

      this.renderIfPossible();
    }

    // potential TODO: check if this is enough for all our usecases
    // maybe provide a custom function to tell if we have enough information to render
    renderIfPossible() {
      if (this.textContent && this.root) {
        this.renderContent();
      }
    }

    renderContent() {
      console.error(`Your class ${this.constructor.name} must provide a custom renderContent() method!` );
    }

  }; // end class
}; // end mixin function

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/*global ShadyCSS*/

const Template = (name, templateString, useShadow = true) => {

  return (superclass) => {

    const template = document.createElement('template');
    template.innerHTML = templateString;

    if (useShadow && 'ShadyCSS' in window) {
      ShadyCSS.prepareTemplate(template, name);
    }

    return class extends superclass {

      static get is() { return name; }

      constructor() {
        super();

        this.clone = document.importNode(template.content, true);
        if (useShadow) {
          this.attachShadow({mode: 'open'});
          this.shadowRoot.appendChild(this.clone);
        }
      }

      connectedCallback() {
        if (this.hasAttribute('distill-prerendered')) {
          return;
        }
        if (useShadow) {
          if ('ShadyCSS' in window) {
            ShadyCSS.styleElement(this);
          }
        } else {
          this.insertBefore(this.clone, this.firstChild);
        }
      }

      get root() {
        if (useShadow) {
          return this.shadowRoot;
        } else {
          return this;
        }
      }

      /* TODO: Are we using these? Should we even? */
      $(query) {
        return this.root.querySelector(query);
      }

      $$(query) {
        return this.root.querySelectorAll(query);
      }
    };
  };
};

var math = "/*\n * Copyright 2018 The Distill Template Authors\n *\n * Licensed under the Apache License, Version 2.0 (the \"License\");\n * you may not use this file except in compliance with the License.\n * You may obtain a copy of the License at\n *\n *      http://www.apache.org/licenses/LICENSE-2.0\n *\n * Unless required by applicable law or agreed to in writing, software\n * distributed under the License is distributed on an \"AS IS\" BASIS,\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n * See the License for the specific language governing permissions and\n * limitations under the License.\n */\n\nspan.katex-display {\n  text-align: left;\n  padding: 8px 0 8px 0;\n  margin: 0.5em 0 0.5em 1em;\n}\n\nspan.katex {\n  -webkit-font-smoothing: antialiased;\n  color: rgba(0, 0, 0, 0.8);\n  font-size: 1.18em;\n}\n\nspan.katex-display > span.katex {\n  white-space: normal;\n}\n\nspan.katex .base {\n  margin-top: 2px;\n  margin-bottom: 2px;\n}\n";

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// This is a straight concatenation of code from KaTeX's contrib folder,
// but we aren't using some of their helpers that don't work well outside a browser environment.

/*global katex */

const findEndOfMath = function(delimiter, text, startIndex) {
  // Adapted from
  // https://github.com/Khan/perseus/blob/master/src/perseus-markdown.jsx
  let index = startIndex;
  let braceLevel = 0;

  const delimLength = delimiter.length;

  while (index < text.length) {
    const character = text[index];

    if (braceLevel <= 0 &&
      text.slice(index, index + delimLength) === delimiter) {
      return index;
    } else if (character === '\\') {
      index++;
    } else if (character === '{') {
      braceLevel++;
    } else if (character === '}') {
      braceLevel--;
    }

    index++;
  }

  return -1;
};

const splitAtDelimiters = function(startData, leftDelim, rightDelim, display) {
  const finalData = [];

  for (let i = 0; i < startData.length; i++) {
    if (startData[i].type === 'text') {
      const text = startData[i].data;

      let lookingForLeft = true;
      let currIndex = 0;
      let nextIndex;

      nextIndex = text.indexOf(leftDelim);
      if (nextIndex !== -1) {
        currIndex = nextIndex;
        finalData.push({
          type: 'text',
          data: text.slice(0, currIndex),
        });
        lookingForLeft = false;
      }

      while (true) { // eslint-disable-line no-constant-condition
        if (lookingForLeft) {
          nextIndex = text.indexOf(leftDelim, currIndex);
          if (nextIndex === -1) {
            break;
          }

          finalData.push({
            type: 'text',
            data: text.slice(currIndex, nextIndex),
          });

          currIndex = nextIndex;
        } else {
          nextIndex = findEndOfMath(
            rightDelim,
            text,
            currIndex + leftDelim.length);
          if (nextIndex === -1) {
            break;
          }

          finalData.push({
            type: 'math',
            data: text.slice(
              currIndex + leftDelim.length,
              nextIndex),
            rawData: text.slice(
              currIndex,
              nextIndex + rightDelim.length),
            display: display,
          });

          currIndex = nextIndex + rightDelim.length;
        }

        lookingForLeft = !lookingForLeft;
      }

      finalData.push({
        type: 'text',
        data: text.slice(currIndex),
      });
    } else {
      finalData.push(startData[i]);
    }
  }

  return finalData;
};


const splitWithDelimiters = function(text, delimiters) {
  let data = [{type: 'text', data: text}];
  for (let i = 0; i < delimiters.length; i++) {
    const delimiter = delimiters[i];
    data = splitAtDelimiters(
      data, delimiter.left, delimiter.right,
      delimiter.display || false);
  }
  return data;
};

/* Note: optionsCopy is mutated by this method. If it is ever exposed in the
 * API, we should copy it before mutating.
 */
const renderMathInText = function(text, optionsCopy) {
  const data = splitWithDelimiters(text, optionsCopy.delimiters);
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < data.length; i++) {
    if (data[i].type === 'text') {
      fragment.appendChild(document.createTextNode(data[i].data));
    } else {
      const tag = document.createElement('d-math');
      const math = data[i].data;
      // Override any display mode defined in the settings with that
      // defined by the text itself
      optionsCopy.displayMode = data[i].display;
      try {
        tag.textContent = math;
        if (optionsCopy.displayMode) {
          tag.setAttribute('block', '');
        }
      } catch (e) {
        if (!(e instanceof katex.ParseError)) {
          throw e;
        }
        optionsCopy.errorCallback(
          'KaTeX auto-render: Failed to parse `' + data[i].data +
          '` with ',
          e
        );
        fragment.appendChild(document.createTextNode(data[i].rawData));
        continue;
      }
      fragment.appendChild(tag);
    }
  }

  return fragment;
};

const renderElem = function(elem, optionsCopy) {
  for (let i = 0; i < elem.childNodes.length; i++) {
    const childNode = elem.childNodes[i];
    if (childNode.nodeType === 3) {
      // Text node
      const frag = renderMathInText(childNode.textContent, optionsCopy);
      i += frag.childNodes.length - 1;
      elem.replaceChild(frag, childNode);
    } else if (childNode.nodeType === 1) {
      // Element node
      const shouldRender = optionsCopy.ignoredTags.indexOf(
        childNode.nodeName.toLowerCase()) === -1;

      if (shouldRender) {
        renderElem(childNode, optionsCopy);
      }
    }
    // Otherwise, it's something else, and ignore it.
  }
};

const defaultAutoRenderOptions = {
  delimiters: [
    {left: '$$', right: '$$', display: true},
    {left: '\\[', right: '\\]', display: true},
    {left: '\\(', right: '\\)', display: false},
    // LaTeX uses this, but it ruins the display of normal `$` in text:
    // {left: '$', right: '$', display: false},
  ],

  ignoredTags: [
    'script', 'noscript', 'style', 'textarea', 'pre', 'code', 'svg',
  ],

  errorCallback: function(msg, err) {
    console.error(msg, err);
  },
};

const renderMathInElement = function(elem, options) {
  if (!elem) {
    throw new Error('No element provided to render');
  }

  const optionsCopy = Object.assign({}, defaultAutoRenderOptions, options);
  renderElem(elem, optionsCopy);
};

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/*global katex */
// attaches renderMathInElement to window
const katexJSURL = 'https://cdn.jsdelivr.net/npm/katex@0.10.2/dist/katex.min.js';
const katexCSSTag = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.10.2/dist/katex.min.css" crossorigin="anonymous">';

const T = Template('d-math', `
${katexCSSTag}
<style>

:host {
  display: inline-block;
  contain: style;
}

:host([block]) {
  display: block;
}

${math}
</style>
<span id='katex-container'></span>
`);

// DMath, not Math, because that would conflict with the JS built-in
class DMath extends Mutating(T(HTMLElement)) {

  static set katexOptions(options) {
    DMath._katexOptions = options;
    if (DMath.katexOptions.delimiters) {
      if (!DMath.katexAdded) {
        DMath.addKatex();
      } else {
        DMath.katexLoadedCallback();
      }
    }
  }

  static get katexOptions() {
    if (!DMath._katexOptions) {
      DMath._katexOptions = {
        delimiters: [ { 'left':'$$', 'right':'$$', 'display': false } ]
      };
    }
    return DMath._katexOptions;
  }

  static katexLoadedCallback() {
    // render all d-math tags
    const mathTags = document.querySelectorAll('d-math');
    for (const mathTag of mathTags) {
      mathTag.renderContent();
    }
    // transform inline delimited math to d-math tags
    if (DMath.katexOptions.delimiters) {
      renderMathInElement(document.body, DMath.katexOptions);
    }
  }

  static addKatex() {
    // css tag can use this convenience function
    document.head.insertAdjacentHTML('beforeend', katexCSSTag);
    // script tag has to be created to work properly
    const scriptTag = document.createElement('script');
    scriptTag.src = katexJSURL;
    scriptTag.async = true;
    scriptTag.onload = DMath.katexLoadedCallback;
    scriptTag.crossorigin = 'anonymous';
    document.head.appendChild(scriptTag);

    DMath.katexAdded = true;
  }

  get options() {
    const localOptions = { displayMode: this.hasAttribute('block') };
    return Object.assign(localOptions, DMath.katexOptions);
  }

  connectedCallback() {
    super.connectedCallback();
    if (!DMath.katexAdded) {
      DMath.addKatex();
    }
  }

  renderContent() {
    if (typeof katex !== 'undefined') {
      const container = this.root.querySelector('#katex-container');
      katex.render(this.textContent, container, this.options);
    }
  }

}

DMath.katexAdded = false;
DMath.inlineMathRendered = false;
window.DMath = DMath; // TODO: check if this can be removed, or if we should expose a distill global

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

function collect_citations(dom=document) {
  const citations = new Set();
  const citeTags = dom.querySelectorAll('d-cite');
  for (const tag of citeTags) {
    const keys = tag.getAttribute('key').split(',');
    for (const key of keys) {
      citations.add(key);
    }
  }
  return [...citations];
}





function author_string(ent, template, sep, finalSep){
  if (ent.author == null) { return ''; }
  var names = ent.author.split(' and ');
  let name_strings = names.map(name => {
    name = name.trim();
    if (name.indexOf(',') != -1){
      var last = name.split(',')[0].trim();
      var firsts = name.split(',')[1];
    } else if (name.indexOf(' ') != -1) {
      var last = name.split(' ').slice(-1)[0].trim();
      var firsts = name.split(' ').slice(0,-1).join(' ');
    } else {
      var last = name.trim();
    }
    var initials = '';
    if (firsts != undefined) {
      initials = firsts.trim().split(' ').map(s => s.trim()[0]);
      initials = initials.join('.')+'.';
    }
    return template.replace('${F}', firsts)
      .replace('${L}', last)
      .replace('${I}', initials)
      .trim(); // in case one of first or last was empty
  });
  if (names.length > 1) {
    var str = name_strings.slice(0, names.length-1).join(sep);
    str += (finalSep || sep) + name_strings[names.length-1];
    return str;
  } else {
    return name_strings[0];
  }
}

function venue_string(ent) {
  var cite = (ent.journal || ent.booktitle || '');
  if ('volume' in ent){
    var issue = ent.issue || ent.number;
    issue = (issue != undefined)? '('+issue+')' : '';
    cite += ', Vol ' + ent.volume + issue;
  }
  if ('pages' in ent){
    cite += ', pp. ' + ent.pages;
  }
  if (cite != '') { cite += '. '; }
  if ('publisher' in ent){
    cite += ent.publisher;
    if (cite[cite.length-1] != '.') { cite += '.'; }
  }
  return cite;
}

function link_string(ent){
  if ('url' in ent){
    var url = ent.url;
    var arxiv_match = (/arxiv\.org\/abs\/([0-9\.]*)/).exec(url);
    if (arxiv_match != null){
      url = `http://arxiv.org/pdf/${arxiv_match[1]}.pdf`;
    }

    if (url.slice(-4) == '.pdf'){
      var label = 'PDF';
    } else if (url.slice(-5) == '.html') {
      var label = 'HTML';
    }
    return ` &ensp;<a href="${url}">[${label||'link'}]</a>`;
  }/* else if ("doi" in ent){
    return ` &ensp;<a href="https://doi.org/${ent.doi}" >[DOI]</a>`;
  }*/ else {
    return '';
  }
}
function doi_string(ent, new_line){
  if ('doi' in ent) {
    return `${new_line?'<br>':''} <a href="https://doi.org/${ent.doi}" style="text-decoration:inherit;">DOI: ${ent.doi}</a>`;
  } else {
    return '';
  }
}

function title_string(ent) {
  return '<span class="title">' + ent.title + '</span> ';
}

function bibliography_cite(ent, fancy){
  if (ent){
    var cite = title_string(ent);
    cite += link_string(ent) + '<br>';
    if (ent.author) {
      cite += author_string(ent, '${L}, ${I}', ', ', ' and ');
      if (ent.year || ent.date) {
        cite += ', ';
      }
    }
    if (ent.year || ent.date) {
      cite += (ent.year || ent.date) + '. ';
    } else {
      cite += '. ';
    }
    cite += venue_string(ent);
    cite += doi_string(ent);
    return cite;
    /*var cite =  author_string(ent, "${L}, ${I}", ", ", " and ");
    if (ent.year || ent.date){
      cite += ", " + (ent.year || ent.date) + ". "
    } else {
      cite += ". "
    }
    cite += "<b>" + ent.title + "</b>. ";
    cite += venue_string(ent);
    cite += doi_string(ent);
    cite += link_string(ent);
    return cite*/
  } else {
    return '?';
  }
}

function hover_cite(ent){
  if (ent){
    var cite = '';
    cite += '<strong>' + ent.title + '</strong>';
    cite += link_string(ent);
    cite += '<br>';

    var a_str = author_string(ent, '${I} ${L}', ', ') + '.';
    var v_str = venue_string(ent).trim() + ' ' + ent.year + '. ' + doi_string(ent, true);

    if ((a_str+v_str).length < Math.min(40, ent.title.length)) {
      cite += a_str + ' ' + v_str;
    } else {
      cite += a_str + '<br>' + v_str;
    }
    return cite;
  } else {
    return '?';
  }
}

function domContentLoaded() {
  return ['interactive', 'complete'].indexOf(document.readyState) !== -1;
}

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

function _moveLegacyAffiliationFormatIntoArray(frontMatter) {
  // authors used to have propoerties "affiliation" and "affiliationURL".
  // We now encourage using an array for affiliations containing objects with
  // properties "name" and "url".
  for (let author of frontMatter.authors) {
    const hasOldStyle = Boolean(author.affiliation);
    const hasNewStyle = Boolean(author.affiliations);
    if (!hasOldStyle) { continue; }
    if (hasNewStyle) {
      console.warn(`Author ${author.author} has both old-style ("affiliation" & "affiliationURL") and new style ("affiliations") affiliation information!`);
    } else {
      let newAffiliation = {
        "name": author.affiliation
      };
      if (author.affiliationURL) { newAffiliation.url = author.affiliationURL; }
      author.affiliations = [newAffiliation];
    }
  }
  return frontMatter
}

function parseFrontmatter(element) {
  const scriptTag = element.firstElementChild;
  if (scriptTag) {
    const type = scriptTag.getAttribute('type');
    if (type.split('/')[1] == 'json') {
      const content = scriptTag.textContent;
      const parsed = JSON.parse(content);
      return _moveLegacyAffiliationFormatIntoArray(parsed);
    } else {
      console.error('Distill only supports JSON frontmatter tags anymore; no more YAML.');
    }
  } else {
    console.error('You added a frontmatter tag but did not provide a script tag with front matter data in it. Please take a look at our templates.');
  }
  return {};
}

class FrontMatter$1 extends HTMLElement {

  static get is() { return 'd-front-matter'; }

  constructor() {
    super();

    const options = {childList: true, characterData: true, subtree: true};
    const observer = new MutationObserver( (entries) => {
      for (const entry of entries) {
        if (entry.target.nodeName === 'SCRIPT' || entry.type === 'characterData') {
          const data = parseFrontmatter(this);
          this.notify(data);
        }
      }
    });
    observer.observe(this, options);
  }

  notify(data) {
    const options = { detail: data, bubbles: true };
    const event = new CustomEvent('onFrontMatterChanged', options);
    document.dispatchEvent(event);
  }

}

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// no appendix -> add appendix
// title in front, no h1 -> add it
// no title in front, h1 -> read and put into frontMatter
// footnote -> footnote list
// break up bib
// if citation, no bib-list -> add citation-list

// if authors, no byline -> add byline

var optionalComponents = function(dom, data) {
  const body = dom.body;
  const article = body.querySelector('d-article');

  // If we don't have an article tag, something weird is going on—giving up.
  if (!article) {
    console.warn('No d-article tag found; skipping adding optional components!');
    return;
  }

  let byline = dom.querySelector('d-byline');
  if (!byline) {
    if (data.authors) {
      byline = dom.createElement('d-byline');
      body.insertBefore(byline, article);
    } else {
      console.warn('No authors found in front matter; please add them before submission!');
    }
  }

  let title = dom.querySelector('d-title');
  if (!title) {
    title = dom.createElement('d-title');
    body.insertBefore(title, byline);
  }

  let h1 = title.querySelector('h1');
  if (!h1) {
    h1 = dom.createElement('h1');
    h1.textContent = data.title;
    title.insertBefore(h1, title.firstChild);
  }

  const hasPassword = typeof data.password !== 'undefined';
  let interstitial = body.querySelector('d-interstitial');
  if (hasPassword && !interstitial) {
    const inBrowser = typeof window !== 'undefined';
    const onLocalhost = inBrowser && window.location.hostname.includes('localhost');
    if (!inBrowser || !onLocalhost) {
      interstitial = dom.createElement('d-interstitial');
      interstitial.password = data.password;
      body.insertBefore(interstitial, body.firstChild);
    }
  } else if (!hasPassword && interstitial) {
    interstitial.parentElement.removeChild(this);
  }

  let appendix = dom.querySelector('d-appendix');
  if (!appendix) {
    appendix = dom.createElement('d-appendix');
    dom.body.appendChild(appendix);
  }

  let footnoteList = dom.querySelector('d-footnote-list');
  if (!footnoteList) {
    footnoteList = dom.createElement('d-footnote-list');
    appendix.appendChild(footnoteList);
  }

  let citationList = dom.querySelector('d-citation-list');
  if (!citationList) {
    citationList = dom.createElement('d-citation-list');
    appendix.appendChild(citationList);
  }

};

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const frontMatter = new FrontMatter();


const Controller = {

  frontMatter: frontMatter,
  waitingOn: {
    bibliography: [],
    citations: [],
  },
  listeners: {

    onCiteKeyCreated(event) {
      const [citeTag, keys] = event.detail;

      // ensure we have citations
      if (!frontMatter.citationsCollected) {
        // console.debug('onCiteKeyCreated, but unresolved dependency ("citations"). Enqueing.');
        Controller.waitingOn.citations.push(() => Controller.listeners.onCiteKeyCreated(event));
        return;
      }

      // ensure we have a loaded bibliography
      if (!frontMatter.bibliographyParsed) {
        // console.debug('onCiteKeyCreated, but unresolved dependency ("bibliography"). Enqueing.');
        Controller.waitingOn.bibliography.push(() => Controller.listeners.onCiteKeyCreated(event));
        return;
      }

      const numbers = keys.map( key => frontMatter.citations.indexOf(key) );
      citeTag.numbers = numbers;
      const entries = keys.map( key => frontMatter.bibliography.get(key) );
      citeTag.entries = entries;
    },

    onCiteKeyChanged() {
      // const [citeTag, keys] = event.detail;

      // update citations
      frontMatter.citations = collect_citations();
      frontMatter.citationsCollected = true;
      for (const waitingCallback of Controller.waitingOn.citations.slice()) {
        waitingCallback();
      }

      // update bibliography
      const citationListTag = document.querySelector('d-citation-list');
      const bibliographyEntries = new Map(frontMatter.citations.map( citationKey => {
        return [citationKey, frontMatter.bibliography.get(citationKey)];
      }));
      citationListTag.citations = bibliographyEntries;

      const citeTags = document.querySelectorAll('d-cite');
      for (const citeTag of citeTags) {
        const keys = citeTag.keys;
        const numbers = keys.map( key => frontMatter.citations.indexOf(key) );
        citeTag.numbers = numbers;
        const entries = keys.map( key => frontMatter.bibliography.get(key) );
        citeTag.entries = entries;
      }

    },

    onCiteKeyRemoved(event) {
      Controller.listeners.onCiteKeyChanged(event);
    },

    onBibliographyChanged(event) {
      const citationListTag = document.querySelector('d-citation-list');

      const bibliography = event.detail;

      frontMatter.bibliography = bibliography;
      frontMatter.bibliographyParsed = true;
      for (const waitingCallback of Controller.waitingOn.bibliography.slice()) {
        waitingCallback();
      }

      // ensure we have citations
      if (!frontMatter.citationsCollected) {
        Controller.waitingOn.citations.push( function() {
          Controller.listeners.onBibliographyChanged({target: event.target, detail: event.detail});
        });
        return;
      }


      if (citationListTag.hasAttribute('distill-prerendered')) {
        console.debug('Citation list was prerendered; not updating it.');
      } else {
        const entries = new Map(frontMatter.citations.map( citationKey => {
          return [citationKey, frontMatter.bibliography.get(citationKey)];
        }));
        citationListTag.citations = entries;
      }
    },

    onFootnoteChanged() {
      // const footnote = event.detail;
      //TODO: optimize to only update current footnote
      const footnotesList = document.querySelector('d-footnote-list');
      if (footnotesList) {
        const footnotes = document.querySelectorAll('d-footnote');
        footnotesList.footnotes = footnotes;
      }
    },

    onFrontMatterChanged(event) {
      const data = event.detail;
      mergeFromYMLFrontmatter(frontMatter, data);

      const interstitial = document.querySelector('d-interstitial');
      if (interstitial) {
        if (typeof frontMatter.password !== 'undefined') {
          interstitial.password = frontMatter.password;
        } else {
          interstitial.parentElement.removeChild(interstitial);
        }
      }

      const prerendered = document.body.hasAttribute('distill-prerendered');
      if (!prerendered && domContentLoaded()) {
        optionalComponents(document, frontMatter);

        const appendix = document.querySelector('distill-appendix');
        if (appendix) {
          appendix.frontMatter = frontMatter;
        }

        const byline = document.querySelector('d-byline');
        if (byline) {
          byline.frontMatter = frontMatter;
        }

        if (data.katex) {
          DMath.katexOptions = data.katex;
        }
      }

    },

    DOMContentLoaded() {
      if (Controller.loaded) {
        console.warn('Controller received DOMContentLoaded but was already loaded!');
        return;
      } else if (!domContentLoaded()) {
        console.warn('Controller received DOMContentLoaded at document.readyState: ' + document.readyState + '!');
        return;
      } else {
        Controller.loaded = true;
        console.debug('Runlevel 4: Controller running DOMContentLoaded');
      }

      const frontMatterTag = document.querySelector('d-front-matter');
      const data = parseFrontmatter(frontMatterTag);
      Controller.listeners.onFrontMatterChanged({detail: data});

      // Resolving "citations" dependency due to initial DOM load
      frontMatter.citations = collect_citations();
      frontMatter.citationsCollected = true;
      for (const waitingCallback of Controller.waitingOn.citations.slice()) {
        waitingCallback();
      }

      if (frontMatter.bibliographyParsed) {
        for (const waitingCallback of Controller.waitingOn.bibliography.slice()) {
          waitingCallback();
        }
      }

      const footnotesList = document.querySelector('d-footnote-list');
      if (footnotesList) {
        const footnotes = document.querySelectorAll('d-footnote');
        footnotesList.footnotes = footnotes;
      }
    }

  }, // listeners

}; // Controller

var base = "/*\r\n * Copyright 2018 The Distill Template Authors\r\n *\r\n * Licensed under the Apache License, Version 2.0 (the \"License\");\r\n * you may not use this file except in compliance with the License.\r\n * You may obtain a copy of the License at\r\n *\r\n *      http://www.apache.org/licenses/LICENSE-2.0\r\n *\r\n * Unless required by applicable law or agreed to in writing, software\r\n * distributed under the License is distributed on an \"AS IS\" BASIS,\r\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\r\n * See the License for the specific language governing permissions and\r\n * limitations under the License.\r\n */\r\n\r\nhtml {\r\n  font-size: 14px;\r\n\tline-height: 1.6em;\r\n  /* font-family: \"Libre Franklin\", \"Helvetica Neue\", sans-serif; */\r\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Oxygen, Ubuntu, Cantarell, \"Fira Sans\", \"Droid Sans\", \"Helvetica Neue\", Arial, sans-serif;\r\n  /*, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\";*/\r\n  text-size-adjust: 100%;\r\n  -ms-text-size-adjust: 100%;\r\n  -webkit-text-size-adjust: 100%;\r\n}\r\n\r\n@media(min-width: 768px) {\r\n  html {\r\n    font-size: 16px;\r\n  }\r\n}\r\n\r\nbody {\r\n  margin: 0;\r\n}\r\n\r\na {\r\n  color: #004276;\r\n}\r\n\r\nfigure {\r\n  margin: 0;\r\n}\r\n\r\ntable {\r\n\tborder-collapse: collapse;\r\n\tborder-spacing: 0;\r\n}\r\n\r\ntable th {\r\n\ttext-align: left;\r\n}\r\n\r\ntable thead {\r\n  border-bottom: 1px solid rgba(0, 0, 0, 0.05);\r\n}\r\n\r\ntable thead th {\r\n  padding-bottom: 0.5em;\r\n}\r\n\r\ntable tbody :first-child td {\r\n  padding-top: 0.5em;\r\n}\r\n\r\npre {\r\n  overflow: auto;\r\n  max-width: 100%;\r\n}\r\n\r\np {\r\n  margin-top: 0;\r\n  margin-bottom: 1em;\r\n}\r\n\r\nsup, sub {\r\n  vertical-align: baseline;\r\n  position: relative;\r\n  top: -0.4em;\r\n  line-height: 1em;\r\n}\r\n\r\nsub {\r\n  top: 0.4em;\r\n}\r\n\r\n.kicker,\r\n.marker {\r\n  font-size: 15px;\r\n  font-weight: 600;\r\n  color: rgba(0, 0, 0, 0.5);\r\n}\r\n\r\n\r\n/* Headline */\r\n\r\n@media(min-width: 1024px) {\r\n  d-title h1 span {\r\n    display: block;\r\n  }\r\n}\r\n\r\n/* Figure */\r\n\r\nfigure {\r\n  position: relative;\r\n  margin-bottom: 2.5em;\r\n  margin-top: 1.5em;\r\n}\r\n\r\nfigcaption+figure {\r\n\r\n}\r\n\r\nfigure img {\r\n  width: 100%;\r\n}\r\n\r\nfigure svg text,\r\nfigure svg tspan {\r\n}\r\n\r\nfigcaption,\r\n.figcaption {\r\n  color: rgba(0, 0, 0, 0.6);\r\n  font-size: 12px;\r\n  line-height: 1.5em;\r\n}\r\n\r\n@media(min-width: 1024px) {\r\nfigcaption,\r\n.figcaption {\r\n    font-size: 13px;\r\n  }\r\n}\r\n\r\nfigure.external img {\r\n  background: white;\r\n  border: 1px solid rgba(0, 0, 0, 0.1);\r\n  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.1);\r\n  padding: 18px;\r\n  box-sizing: border-box;\r\n}\r\n\r\nfigcaption a {\r\n  color: rgba(0, 0, 0, 0.6);\r\n}\r\n\r\nfigcaption b,\r\nfigcaption strong, {\r\n  font-weight: 600;\r\n  color: rgba(0, 0, 0, 1.0);\r\n}\r\n";

var layout = "/*\r\n * Copyright 2018 The Distill Template Authors\r\n *\r\n * Licensed under the Apache License, Version 2.0 (the \"License\");\r\n * you may not use this file except in compliance with the License.\r\n * You may obtain a copy of the License at\r\n *\r\n *      http://www.apache.org/licenses/LICENSE-2.0\r\n *\r\n * Unless required by applicable law or agreed to in writing, software\r\n * distributed under the License is distributed on an \"AS IS\" BASIS,\r\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\r\n * See the License for the specific language governing permissions and\r\n * limitations under the License.\r\n */\r\n\r\n@supports not (display: grid) {\r\n  .base-grid,\r\n  distill-header,\r\n  d-title,\r\n  d-abstract,\r\n  d-article,\r\n  d-appendix,\r\n  distill-appendix,\r\n  d-byline,\r\n  d-footnote-list,\r\n  d-citation-list,\r\n  distill-footer {\r\n    display: block;\r\n    padding: 8px;\r\n  }\r\n}\r\n\r\n.base-grid,\r\ndistill-header,\r\nd-title,\r\nd-abstract,\r\nd-article,\r\nd-appendix,\r\ndistill-appendix,\r\nd-byline,\r\nd-footnote-list,\r\nd-citation-list,\r\ndistill-footer {\r\n  display: grid;\r\n  justify-items: stretch;\r\n  grid-template-columns: [screen-start] 8px [page-start kicker-start text-start gutter-start middle-start] 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr [text-end page-end gutter-end kicker-end middle-end] 8px [screen-end];\r\n  grid-column-gap: 8px;\r\n}\r\n\r\n.grid {\r\n  display: grid;\r\n  grid-column-gap: 8px;\r\n}\r\n\r\n@media(min-width: 768px) {\r\n  .base-grid,\r\n  distill-header,\r\n  d-title,\r\n  d-abstract,\r\n  d-article,\r\n  d-appendix,\r\n  distill-appendix,\r\n  d-byline,\r\n  d-footnote-list,\r\n  d-citation-list,\r\n  distill-footer {\r\n    grid-template-columns: [screen-start] 1fr [page-start kicker-start middle-start text-start] 45px 45px 45px 45px 45px 45px 45px 45px [ kicker-end text-end gutter-start] 45px [middle-end] 45px [page-end gutter-end] 1fr [screen-end];\r\n    grid-column-gap: 16px;\r\n  }\r\n\r\n  .grid {\r\n    grid-column-gap: 16px;\r\n  }\r\n}\r\n\r\n@media(min-width: 1000px) {\r\n  .base-grid,\r\n  distill-header,\r\n  d-title,\r\n  d-abstract,\r\n  d-article,\r\n  d-appendix,\r\n  distill-appendix,\r\n  d-byline,\r\n  d-footnote-list,\r\n  d-citation-list,\r\n  distill-footer {\r\n    grid-template-columns: [screen-start] 1fr [page-start kicker-start] 50px [middle-start] 50px [text-start kicker-end] 50px 50px 50px 50px 50px 50px 50px 50px [text-end gutter-start] 50px [middle-end] 50px [page-end gutter-end] 1fr [screen-end];\r\n    grid-column-gap: 16px;\r\n  }\r\n\r\n  .grid {\r\n    grid-column-gap: 16px;\r\n  }\r\n}\r\n\r\n@media(min-width: 1180px) {\r\n  .base-grid,\r\n  distill-header,\r\n  d-title,\r\n  d-abstract,\r\n  d-article,\r\n  d-appendix,\r\n  distill-appendix,\r\n  d-byline,\r\n  d-footnote-list,\r\n  d-citation-list,\r\n  distill-footer {\r\n    grid-template-columns: [screen-start] 1fr [page-start kicker-start] 60px [middle-start] 60px [text-start kicker-end] 60px 60px 60px 60px 60px 60px 60px 60px [text-end gutter-start] 60px [middle-end] 60px [page-end gutter-end] 1fr [screen-end];\r\n    grid-column-gap: 32px;\r\n  }\r\n\r\n  .grid {\r\n    grid-column-gap: 32px;\r\n  }\r\n}\r\n\r\n\r\n\r\n\r\n.base-grid {\r\n  grid-column: screen;\r\n}\r\n\r\n/* .l-body,\r\nd-article > *  {\r\n  grid-column: text;\r\n}\r\n\r\n.l-page,\r\nd-title > *,\r\nd-figure {\r\n  grid-column: page;\r\n} */\r\n\r\n.l-gutter {\r\n  grid-column: gutter;\r\n}\r\n\r\n.l-text,\r\n.l-body {\r\n  grid-column: text;\r\n}\r\n\r\n.l-page {\r\n  grid-column: page;\r\n}\r\n\r\n.l-body-outset {\r\n  grid-column: middle;\r\n}\r\n\r\n.l-page-outset {\r\n  grid-column: page;\r\n}\r\n\r\n.l-screen {\r\n  grid-column: screen;\r\n}\r\n\r\n.l-screen-inset {\r\n  grid-column: screen;\r\n  padding-left: 16px;\r\n  padding-left: 16px;\r\n}\r\n\r\n\r\n/* Aside */\r\n\r\nd-article aside {\r\n  grid-column: gutter;\r\n  font-size: 12px;\r\n  line-height: 1.6em;\r\n  color: rgba(0, 0, 0, 0.6)\r\n}\r\n\r\n@media(min-width: 768px) {\r\n  aside {\r\n    grid-column: gutter;\r\n  }\r\n\r\n  .side {\r\n    grid-column: gutter;\r\n  }\r\n}\r\n";

var print = "/*\r\n * Copyright 2018 The Distill Template Authors\r\n *\r\n * Licensed under the Apache License, Version 2.0 (the \"License\");\r\n * you may not use this file except in compliance with the License.\r\n * You may obtain a copy of the License at\r\n *\r\n *      http://www.apache.org/licenses/LICENSE-2.0\r\n *\r\n * Unless required by applicable law or agreed to in writing, software\r\n * distributed under the License is distributed on an \"AS IS\" BASIS,\r\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\r\n * See the License for the specific language governing permissions and\r\n * limitations under the License.\r\n */\r\n\r\n@media print {\r\n\r\n  @page {\r\n    size: 8in 11in;\r\n    @bottom-right {\r\n      content: counter(page) \" of \" counter(pages);\r\n    }\r\n  }\r\n\r\n  html {\r\n    /* no general margins -- CSS Grid takes care of those */\r\n  }\r\n\r\n  p, code {\r\n    page-break-inside: avoid;\r\n  }\r\n\r\n  h2, h3 {\r\n    page-break-after: avoid;\r\n  }\r\n\r\n  d-header {\r\n    visibility: hidden;\r\n  }\r\n\r\n  d-footer {\r\n    display: none!important;\r\n  }\r\n\r\n}\r\n";

var byline = "/*\r\n * Copyright 2018 The Distill Template Authors\r\n *\r\n * Licensed under the Apache License, Version 2.0 (the \"License\");\r\n * you may not use this file except in compliance with the License.\r\n * You may obtain a copy of the License at\r\n *\r\n *      http://www.apache.org/licenses/LICENSE-2.0\r\n *\r\n * Unless required by applicable law or agreed to in writing, software\r\n * distributed under the License is distributed on an \"AS IS\" BASIS,\r\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\r\n * See the License for the specific language governing permissions and\r\n * limitations under the License.\r\n */\r\n\r\nd-byline {\r\n  contain: style;\r\n  overflow: hidden;\r\n  border-top: 1px solid rgba(0, 0, 0, 0.1);\r\n  font-size: 0.8rem;\r\n  line-height: 1.8em;\r\n  padding: 1.5rem 0;\r\n  min-height: 1.8em;\r\n}\r\n\r\n\r\nd-byline .byline {\r\n  grid-template-columns: 1fr 1fr;\r\n  grid-column: text;\r\n}\r\n\r\n@media(min-width: 768px) {\r\n  d-byline .byline {\r\n    grid-template-columns: 1fr 1fr 1fr 1fr;\r\n  }\r\n}\r\n\r\nd-byline .authors-affiliations {\r\n  grid-column-end: span 2;\r\n  grid-template-columns: 1fr 1fr;\r\n  margin-bottom: 1em;\r\n}\r\n\r\n@media(min-width: 768px) {\r\n  d-byline .authors-affiliations {\r\n    margin-bottom: 0;\r\n  }\r\n}\r\n\r\nd-byline h3 {\r\n  font-size: 0.6rem;\r\n  font-weight: 400;\r\n  color: rgba(0, 0, 0, 0.5);\r\n  margin: 0;\r\n  text-transform: uppercase;\r\n}\r\n\r\nd-byline p {\r\n  margin: 0;\r\n}\r\n\r\nd-byline a,\r\nd-article d-byline a {\r\n  color: rgba(0, 0, 0, 0.8);\r\n  text-decoration: none;\r\n  border-bottom: none;\r\n}\r\n\r\nd-article d-byline a:hover {\r\n  text-decoration: underline;\r\n  border-bottom: none;\r\n}\r\n\r\nd-byline p.author {\r\n  font-weight: 500;\r\n}\r\n\r\nd-byline .affiliations {\r\n\r\n}\r\n";

var article = "/*\r\n * Copyright 2018 The Distill Template Authors\r\n *\r\n * Licensed under the Apache License, Version 2.0 (the \"License\");\r\n * you may not use this file except in compliance with the License.\r\n * You may obtain a copy of the License at\r\n *\r\n *      http://www.apache.org/licenses/LICENSE-2.0\r\n *\r\n * Unless required by applicable law or agreed to in writing, software\r\n * distributed under the License is distributed on an \"AS IS\" BASIS,\r\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\r\n * See the License for the specific language governing permissions and\r\n * limitations under the License.\r\n */\r\n\r\nd-article {\r\n  contain: layout style;\r\n  overflow-x: hidden;\r\n  border-top: 1px solid rgba(0, 0, 0, 0.1);\r\n  padding-top: 2rem;\r\n  color: rgba(0, 0, 0, 0.8);\r\n}\r\n\r\nd-article > * {\r\n  grid-column: text;\r\n}\r\n\r\n@media(min-width: 768px) {\r\n  d-article {\r\n    font-size: 16px;\r\n  }\r\n}\r\n\r\n@media(min-width: 1024px) {\r\n  d-article {\r\n    font-size: 1.06rem;\r\n    line-height: 1.7em;\r\n  }\r\n}\r\n\r\n\r\n/* H2 */\r\n\r\n\r\nd-article .marker {\r\n  text-decoration: none;\r\n  border: none;\r\n  counter-reset: section;\r\n  grid-column: kicker;\r\n  line-height: 1.7em;\r\n}\r\n\r\nd-article .marker:hover {\r\n  border: none;\r\n}\r\n\r\nd-article .marker span {\r\n  padding: 0 3px 4px;\r\n  border-bottom: 1px solid rgba(0, 0, 0, 0.2);\r\n  position: relative;\r\n  top: 4px;\r\n}\r\n\r\nd-article .marker:hover span {\r\n  color: rgba(0, 0, 0, 0.7);\r\n  border-bottom: 1px solid rgba(0, 0, 0, 0.7);\r\n}\r\n\r\nd-article h2 {\r\n  font-weight: 600;\r\n  font-size: 24px;\r\n  line-height: 1.25em;\r\n  margin: 2rem 0 1.5rem 0;\r\n  border-bottom: 1px solid rgba(0, 0, 0, 0.1);\r\n  padding-bottom: 1rem;\r\n}\r\n\r\n@media(min-width: 1024px) {\r\n  d-article h2 {\r\n    font-size: 36px;\r\n  }\r\n}\r\n\r\n/* H3 */\r\n\r\nd-article h3 {\r\n  font-weight: 700;\r\n  font-size: 18px;\r\n  line-height: 1.4em;\r\n  margin-bottom: 1em;\r\n  margin-top: 2em;\r\n}\r\n\r\n@media(min-width: 1024px) {\r\n  d-article h3 {\r\n    font-size: 20px;\r\n  }\r\n}\r\n\r\n/* H4 */\r\n\r\nd-article h4 {\r\n  font-weight: 600;\r\n  text-transform: uppercase;\r\n  font-size: 14px;\r\n  line-height: 1.4em;\r\n}\r\n\r\nd-article a {\r\n  color: inherit;\r\n}\r\n\r\nd-article p,\r\nd-article ul,\r\nd-article ol,\r\nd-article blockquote {\r\n  margin-top: 0;\r\n  margin-bottom: 1em;\r\n  margin-left: 0;\r\n  margin-right: 0;\r\n}\r\n\r\nd-article blockquote {\r\n  border-left: 2px solid rgba(0, 0, 0, 0.2);\r\n  padding-left: 2em;\r\n  font-style: italic;\r\n  color: rgba(0, 0, 0, 0.6);\r\n}\r\n\r\nd-article a {\r\n  border-bottom: 1px solid rgba(0, 0, 0, 0.4);\r\n  text-decoration: none;\r\n}\r\n\r\nd-article a:hover {\r\n  border-bottom: 1px solid rgba(0, 0, 0, 0.8);\r\n}\r\n\r\nd-article .link {\r\n  text-decoration: underline;\r\n  cursor: pointer;\r\n}\r\n\r\nd-article ul,\r\nd-article ol {\r\n  padding-left: 24px;\r\n}\r\n\r\nd-article li {\r\n  margin-bottom: 1em;\r\n  margin-left: 0;\r\n  padding-left: 0;\r\n}\r\n\r\nd-article li:last-child {\r\n  margin-bottom: 0;\r\n}\r\n\r\nd-article pre {\r\n  font-size: 14px;\r\n  margin-bottom: 20px;\r\n}\r\n\r\nd-article hr {\r\n  grid-column: screen;\r\n  width: 100%;\r\n  border: none;\r\n  border-bottom: 1px solid rgba(0, 0, 0, 0.1);\r\n  margin-top: 60px;\r\n  margin-bottom: 60px;\r\n}\r\n\r\nd-article section {\r\n  margin-top: 60px;\r\n  margin-bottom: 60px;\r\n}\r\n\r\nd-article span.equation-mimic {\r\n  font-family: georgia;\r\n  font-size: 115%;\r\n  font-style: italic;\r\n}\r\n\r\nd-article > d-code,\r\nd-article section > d-code  {\r\n  display: block;\r\n}\r\n\r\nd-article > d-math[block],\r\nd-article section > d-math[block]  {\r\n  display: block;\r\n}\r\n\r\n@media (max-width: 768px) {\r\n  d-article > d-code,\r\n  d-article section > d-code,\r\n  d-article > d-math[block],\r\n  d-article section > d-math[block] {\r\n      overflow-x: scroll;\r\n      -ms-overflow-style: none;  // IE 10+\r\n      overflow: -moz-scrollbars-none;  // Firefox\r\n  }\r\n\r\n  d-article > d-code::-webkit-scrollbar,\r\n  d-article section > d-code::-webkit-scrollbar,\r\n  d-article > d-math[block]::-webkit-scrollbar,\r\n  d-article section > d-math[block]::-webkit-scrollbar {\r\n    display: none;  // Safari and Chrome\r\n  }\r\n}\r\n\r\nd-article .citation {\r\n  color: #668;\r\n  cursor: pointer;\r\n}\r\n\r\nd-include {\r\n  width: auto;\r\n  display: block;\r\n}\r\n\r\nd-figure {\r\n  contain: layout style;\r\n}\r\n\r\n/* KaTeX */\r\n\r\n.katex, .katex-prerendered {\r\n  contain: style;\r\n  display: inline-block;\r\n}\r\n\r\n/* Tables */\r\n\r\nd-article table {\r\n  border-collapse: collapse;\r\n  margin-bottom: 1.5rem;\r\n  border-bottom: 1px solid rgba(0, 0, 0, 0.2);\r\n}\r\n\r\nd-article table th {\r\n  border-bottom: 1px solid rgba(0, 0, 0, 0.2);\r\n}\r\n\r\nd-article table td {\r\n  border-bottom: 1px solid rgba(0, 0, 0, 0.05);\r\n}\r\n\r\nd-article table tr:last-of-type td {\r\n  border-bottom: none;\r\n}\r\n\r\nd-article table th,\r\nd-article table td {\r\n  font-size: 15px;\r\n  padding: 2px 8px;\r\n}\r\n\r\nd-article table tbody :first-child td {\r\n  padding-top: 2px;\r\n}\r\n";

var title = "/*\r\n * Copyright 2018 The Distill Template Authors\r\n *\r\n * Licensed under the Apache License, Version 2.0 (the \"License\");\r\n * you may not use this file except in compliance with the License.\r\n * You may obtain a copy of the License at\r\n *\r\n *      http://www.apache.org/licenses/LICENSE-2.0\r\n *\r\n * Unless required by applicable law or agreed to in writing, software\r\n * distributed under the License is distributed on an \"AS IS\" BASIS,\r\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\r\n * See the License for the specific language governing permissions and\r\n * limitations under the License.\r\n */\r\n\r\nd-title {\r\n  padding: 2rem 0 1.5rem;\r\n  contain: layout style;\r\n  overflow-x: hidden;\r\n}\r\n\r\n@media(min-width: 768px) {\r\n  d-title {\r\n    padding: 4rem 0 1.5rem;\r\n  }\r\n}\r\n\r\nd-title h1 {\r\n  grid-column: text;\r\n  font-size: 40px;\r\n  font-weight: 700;\r\n  line-height: 1.1em;\r\n  margin: 0 0 0.5rem;\r\n}\r\n\r\n@media(min-width: 768px) {\r\n  d-title h1 {\r\n    font-size: 50px;\r\n  }\r\n}\r\n\r\nd-title p {\r\n  font-weight: 300;\r\n  font-size: 1.2rem;\r\n  line-height: 1.55em;\r\n  grid-column: text;\r\n}\r\n\r\nd-title .status {\r\n  margin-top: 0px;\r\n  font-size: 12px;\r\n  color: #009688;\r\n  opacity: 0.8;\r\n  grid-column: kicker;\r\n}\r\n\r\nd-title .status span {\r\n  line-height: 1;\r\n  display: inline-block;\r\n  padding: 6px 0;\r\n  border-bottom: 1px solid #80cbc4;\r\n  font-size: 11px;\r\n  text-transform: uppercase;\r\n}\r\n";

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const styles = base + layout + title + byline + article + math + print;

function makeStyleTag(dom) {

  const styleTagId = 'distill-prerendered-styles';
  const prerenderedTag = dom.getElementById(styleTagId);
  if (!prerenderedTag) {
    const styleTag = dom.createElement('style');
    styleTag.id = styleTagId;
    styleTag.type = 'text/css';
    const cssTextTag = dom.createTextNode(styles);
    styleTag.appendChild(cssTextTag);
    const firstScriptTag = dom.head.querySelector('script');
    dom.head.insertBefore(styleTag, firstScriptTag);
  }

}

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

function addPolyfill(polyfill, polyfillLoadedCallback) {
  console.debug('Runlevel 0: Polyfill required: ' + polyfill.name);
  const script = document.createElement('script');
  script.src = polyfill.url;
  script.async = false;
  if (polyfillLoadedCallback) {
    script.onload = function() { polyfillLoadedCallback(polyfill); };
  }
  script.onerror = function() {
    new Error('Runlevel 0: Polyfills failed to load script ' + polyfill.name);
  };
  document.head.appendChild(script);
}

const polyfills = [
  {
    name: 'WebComponents',
    support: function() {
      return 'customElements' in window &&
             'attachShadow' in Element.prototype &&
             'getRootNode' in Element.prototype &&
             'content' in document.createElement('template') &&
             'Promise' in window &&
             'from' in Array;
    },
    url: 'https://distill.pub/third-party/polyfills/webcomponents-lite.js'
  }, {
    name: 'IntersectionObserver',
    support: function() {
      return 'IntersectionObserver' in window &&
             'IntersectionObserverEntry' in window;
    },
    url: 'https://distill.pub/third-party/polyfills/intersection-observer.js'
  },
];

class Polyfills {

  static browserSupportsAllFeatures() {
    return polyfills.every((poly) => poly.support());
  }

  static load(callback) {
    // Define an intermediate callback that checks if all is loaded.
    const polyfillLoaded = function(polyfill) {
      polyfill.loaded = true;
      console.debug('Runlevel 0: Polyfill has finished loading: ' + polyfill.name);
      // console.debug(window[polyfill.name]);
      if (Polyfills.neededPolyfills.every((poly) => poly.loaded)) {
        console.debug('Runlevel 0: All required polyfills have finished loading.');
        console.debug('Runlevel 0->1.');
        window.distillRunlevel = 1;
        callback();
      }
    };
    // Add polyfill script tags
    for (const polyfill of Polyfills.neededPolyfills) {
      addPolyfill(polyfill, polyfillLoaded);
    }
  }

  static get neededPolyfills() {
    if (!Polyfills._neededPolyfills) {
      Polyfills._neededPolyfills = polyfills.filter((poly) => !poly.support());
    }
    return Polyfills._neededPolyfills;
  }
}

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// const marginSmall = 16;
// const marginLarge = 3 * marginSmall;
// const margin = marginSmall + marginLarge;
// const gutter = marginSmall;
// const outsetAmount = margin / 2;
// const numCols = 4;
// const numGutters = numCols - 1;
// const columnWidth = (768 - 2 * marginLarge - numGutters * gutter) / numCols;
//
// const screenwidth = 768;
// const pageWidth = screenwidth - 2 * marginLarge;
// const bodyWidth = pageWidth - columnWidth - gutter;

function body(selector) {
  return `${selector} {
      grid-column: left / text;
    }
  `;
}

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const T$1 = Template('d-abstract', `
<style>
  :host {
    font-size: 1.25rem;
    line-height: 1.6em;
    color: rgba(0, 0, 0, 0.7);
    -webkit-font-smoothing: antialiased;
  }

  ::slotted(p) {
    margin-top: 0;
    margin-bottom: 1em;
    grid-column: text-start / middle-end;
  }
  ${body('d-abstract')}
</style>

<slot></slot>
`);

class Abstract extends T$1(HTMLElement) {

}

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const T$2 = Template('d-appendix', `
<style>

d-appendix {
  contain: layout style;
  font-size: 0.8em;
  line-height: 1.7em;
  margin-top: 60px;
  margin-bottom: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  color: rgba(0,0,0,0.5);
  padding-top: 60px;
  padding-bottom: 48px;
}

d-appendix h3 {
  grid-column: page-start / text-start;
  font-size: 15px;
  font-weight: 500;
  margin-top: 1em;
  margin-bottom: 0;
  color: rgba(0,0,0,0.65);
}

d-appendix h3 + * {
  margin-top: 1em;
}

d-appendix ol {
  padding: 0 0 0 15px;
}

@media (min-width: 768px) {
  d-appendix ol {
    padding: 0 0 0 30px;
    margin-left: -30px;
  }
}

d-appendix li {
  margin-bottom: 1em;
}

d-appendix a {
  color: rgba(0, 0, 0, 0.6);
}

d-appendix > * {
  grid-column: text;
}

d-appendix > d-footnote-list,
d-appendix > d-citation-list,
d-appendix > distill-appendix {
  grid-column: screen;
}

</style>

`, false);

class Appendix extends T$2(HTMLElement) {

}

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// import { Template } from '../mixins/template';
// import { Controller } from '../controller';

const isOnlyWhitespace = /^\s*$/;

class Article extends HTMLElement {
  static get is() { return 'd-article'; }

  constructor() {
    super();

    new MutationObserver( (mutations) => {
      for (const mutation of mutations) {
        for (const addedNode of mutation.addedNodes) {
          switch (addedNode.nodeName) {
          case '#text': { // usually text nodes are only linebreaks.
            const text = addedNode.nodeValue;
            if (!isOnlyWhitespace.test(text)) {
              console.warn('Use of unwrapped text in distill articles is discouraged as it breaks layout! Please wrap any text in a <span> or <p> tag. We found the following text: ' + text);
              const wrapper = document.createElement('span');
              wrapper.innerHTML = addedNode.nodeValue;
              addedNode.parentNode.insertBefore(wrapper, addedNode);
              addedNode.parentNode.removeChild(addedNode);
            }
          } break;
          }
        }
      }
    }).observe(this, {childList: true});
  }

}

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};





function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var bibtexParse = createCommonjsModule(function (module, exports) {
/* start bibtexParse 0.0.22 */

//Original work by Henrik Muehe (c) 2010
//
//CommonJS port by Mikola Lysenko 2013
//
//Port to Browser lib by ORCID / RCPETERS
//
//Issues:
//no comment handling within strings
//no string concatenation
//no variable values yet
//Grammar implemented here:
//bibtex -> (string | preamble | comment | entry)*;
//string -> '@STRING' '{' key_equals_value '}';
//preamble -> '@PREAMBLE' '{' value '}';
//comment -> '@COMMENT' '{' value '}';
//entry -> '@' key '{' key ',' key_value_list '}';
//key_value_list -> key_equals_value (',' key_equals_value)*;
//key_equals_value -> key '=' value;
//value -> value_quotes | value_braces | key;
//value_quotes -> '"' .*? '"'; // not quite
//value_braces -> '{' .*? '"'; // not quite
(function(exports) {

    function BibtexParser() {
        
        this.months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        this.notKey = [',','{','}',' ','='];
        this.pos = 0;
        this.input = "";
        this.entries = new Array();

        this.currentEntry = "";

        this.setInput = function(t) {
            this.input = t;
        };

        this.getEntries = function() {
            return this.entries;
        };

        this.isWhitespace = function(s) {
            return (s == ' ' || s == '\r' || s == '\t' || s == '\n');
        };

        this.match = function(s, canCommentOut) {
            if (canCommentOut == undefined || canCommentOut == null)
                { canCommentOut = true; }
            this.skipWhitespace(canCommentOut);
            if (this.input.substring(this.pos, this.pos + s.length) == s) {
                this.pos += s.length;
            } else {
                throw "Token mismatch, expected " + s + ", found "
                        + this.input.substring(this.pos);
            }
            this.skipWhitespace(canCommentOut);
        };

        this.tryMatch = function(s, canCommentOut) {
            if (canCommentOut == undefined || canCommentOut == null)
                { canCommentOut = true; }
            this.skipWhitespace(canCommentOut);
            if (this.input.substring(this.pos, this.pos + s.length) == s) {
                return true;
            } else {
                return false;
            }
            this.skipWhitespace(canCommentOut);
        };

        /* when search for a match all text can be ignored, not just white space */
        this.matchAt = function() {
            while (this.input.length > this.pos && this.input[this.pos] != '@') {
                this.pos++;
            }

            if (this.input[this.pos] == '@') {
                return true;
            }
            return false;
        };

        this.skipWhitespace = function(canCommentOut) {
            while (this.isWhitespace(this.input[this.pos])) {
                this.pos++;
            }
            if (this.input[this.pos] == "%" && canCommentOut == true) {
                while (this.input[this.pos] != "\n") {
                    this.pos++;
                }
                this.skipWhitespace(canCommentOut);
            }
        };

        this.value_braces = function() {
            var bracecount = 0;
            this.match("{", false);
            var start = this.pos;
            var escaped = false;
            while (true) {
                if (!escaped) {
                    if (this.input[this.pos] == '}') {
                        if (bracecount > 0) {
                            bracecount--;
                        } else {
                            var end = this.pos;
                            this.match("}", false);
                            return this.input.substring(start, end);
                        }
                    } else if (this.input[this.pos] == '{') {
                        bracecount++;
                    } else if (this.pos >= this.input.length - 1) {
                        throw "Unterminated value";
                    }
                }
                if (this.input[this.pos] == '\\' && escaped == false)
                    { escaped = true; }
                else
                    { escaped = false; }
                this.pos++;
            }
        };

        this.value_comment = function() {
            var str = '';
            var brcktCnt = 0;
            while (!(this.tryMatch("}", false) && brcktCnt == 0)) {
                str = str + this.input[this.pos];
                if (this.input[this.pos] == '{')
                    { brcktCnt++; }
                if (this.input[this.pos] == '}')
                    { brcktCnt--; }
                if (this.pos >= this.input.length - 1) {
                    throw "Unterminated value:" + this.input.substring(start);
                }
                this.pos++;
            }
            return str;
        };

        this.value_quotes = function() {
            this.match('"', false);
            var start = this.pos;
            var escaped = false;
            while (true) {
                if (!escaped) {
                    if (this.input[this.pos] == '"') {
                        var end = this.pos;
                        this.match('"', false);
                        return this.input.substring(start, end);
                    } else if (this.pos >= this.input.length - 1) {
                        throw "Unterminated value:" + this.input.substring(start);
                    }
                }
                if (this.input[this.pos] == '\\' && escaped == false)
                    { escaped = true; }
                else
                    { escaped = false; }
                this.pos++;
            }
        };

        this.single_value = function() {
            var start = this.pos;
            if (this.tryMatch("{")) {
                return this.value_braces();
            } else if (this.tryMatch('"')) {
                return this.value_quotes();
            } else {
                var k = this.key();
                if (k.match("^[0-9]+$"))
                    { return k; }
                else if (this.months.indexOf(k.toLowerCase()) >= 0)
                    { return k.toLowerCase(); }
                else
                    { throw "Value expected:" + this.input.substring(start) + ' for key: ' + k; }
            
            }
        };

        this.value = function() {
            var values = [];
            values.push(this.single_value());
            while (this.tryMatch("#")) {
                this.match("#");
                values.push(this.single_value());
            }
            return values.join("");
        };

        this.key = function() {
            var start = this.pos;
            while (true) {
                if (this.pos >= this.input.length) {
                    throw "Runaway key";
                }
                                // а-яА-Я is Cyrillic
                //console.log(this.input[this.pos]);
                if (this.notKey.indexOf(this.input[this.pos]) >= 0) {
                    return this.input.substring(start, this.pos);
                } else {
                    this.pos++;
                    
                }
            }
        };

        this.key_equals_value = function() {
            var key = this.key();
            if (this.tryMatch("=")) {
                this.match("=");
                var val = this.value();
                return [ key, val ];
            } else {
                throw "... = value expected, equals sign missing:"
                        + this.input.substring(this.pos);
            }
        };

        this.key_value_list = function() {
            var kv = this.key_equals_value();
            this.currentEntry['entryTags'] = {};
            this.currentEntry['entryTags'][kv[0]] = kv[1];
            while (this.tryMatch(",")) {
                this.match(",");
                // fixes problems with commas at the end of a list
                if (this.tryMatch("}")) {
                    break;
                }
                
                kv = this.key_equals_value();
                this.currentEntry['entryTags'][kv[0]] = kv[1];
            }
        };

        this.entry_body = function(d) {
            this.currentEntry = {};
            this.currentEntry['citationKey'] = this.key();
            this.currentEntry['entryType'] = d.substring(1);
            this.match(",");
            this.key_value_list();
            this.entries.push(this.currentEntry);
        };

        this.directive = function() {
            this.match("@");
            return "@" + this.key();
        };

        this.preamble = function() {
            this.currentEntry = {};
            this.currentEntry['entryType'] = 'PREAMBLE';
            this.currentEntry['entry'] = this.value_comment();
            this.entries.push(this.currentEntry);
        };

        this.comment = function() {
            this.currentEntry = {};
            this.currentEntry['entryType'] = 'COMMENT';
            this.currentEntry['entry'] = this.value_comment();
            this.entries.push(this.currentEntry);
        };

        this.entry = function(d) {
            this.entry_body(d);
        };

        this.bibtex = function() {
            while (this.matchAt()) {
                var d = this.directive();
                this.match("{");
                if (d == "@STRING") {
                    this.string();
                } else if (d == "@PREAMBLE") {
                    this.preamble();
                } else if (d == "@COMMENT") {
                    this.comment();
                } else {
                    this.entry(d);
                }
                this.match("}");
            }
        };
    }
    
    exports.toJSON = function(bibtex) {
        var b = new BibtexParser();
        b.setInput(bibtex);
        b.bibtex();
        return b.entries;
    };

    /* added during hackathon don't hate on me */
    exports.toBibtex = function(json) {
        var out = '';
        for ( var i in json) {
            out += "@" + json[i].entryType;
            out += '{';
            if (json[i].citationKey)
                { out += json[i].citationKey + ', '; }
            if (json[i].entry)
                { out += json[i].entry ; }
            if (json[i].entryTags) {
                var tags = '';
                for (var jdx in json[i].entryTags) {
                    if (tags.length != 0)
                        { tags += ', '; }
                    tags += jdx + '= {' + json[i].entryTags[jdx] + '}';
                }
                out += tags;
            }
            out += '}\n\n';
        }
        return out;
        
    };

})(exports);

/* end bibtexParse */
});

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

function normalizeTag(string) {
  return string
    .replace(/[\t\n ]+/g, ' ')
    .replace(/{\\["^`.'acu~Hvs]( )?([a-zA-Z])}/g, (full, x, char) => char)
    .replace(/{\\([a-zA-Z])}/g, (full, char) => char);
}

function parseBibtex(bibtex) {
  const bibliography = new Map();
  const parsedEntries = bibtexParse.toJSON(bibtex);
  for (const entry of parsedEntries) {
    // normalize tags; note entryTags is an object, not Map
    for (const [key, value] of Object.entries(entry.entryTags)) {
      entry.entryTags[key.toLowerCase()] = normalizeTag(value);
    }
    entry.entryTags.type = entry.entryType;
    // add to bibliography
    bibliography.set(entry.citationKey, entry.entryTags);
  }
  return bibliography;
}

function serializeFrontmatterToBibtex(frontMatter) {
  return `@article{${frontMatter.slug},
  author = {${frontMatter.bibtexAuthors}},
  title = {${frontMatter.title}},
  journal = {${frontMatter.journal.title}},
  year = {${frontMatter.publishedYear}},
  note = {${frontMatter.url}},
  doi = {${frontMatter.doi}}
}`;
}

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.



class Bibliography extends HTMLElement {

  static get is() { return 'd-bibliography'; }

  constructor() {
    super();

    // set up mutation observer
    const options = {childList: true, characterData: true, subtree: true};
    const observer = new MutationObserver( (entries) => {
      for (const entry of entries) {
        if (entry.target.nodeName === 'SCRIPT' || entry.type === 'characterData') {
          this.parseIfPossible();
        }
      }
    });
    observer.observe(this, options);
  }

  connectedCallback() {
    requestAnimationFrame(() => {
      this.parseIfPossible();
    });
  }

  parseIfPossible() {
    const scriptTag = this.querySelector('script');
    if (!scriptTag) { return; }
    if (scriptTag.type == 'text/bibtex') {
      const newBibtex = scriptTag.textContent;
      if (this.bibtex !== newBibtex) {
        this.bibtex = newBibtex;
        const bibliography = parseBibtex(this.bibtex);
        this.notify(bibliography);
      }
    } else if (scriptTag.type == 'text/json') {
      const bibliography = new Map(JSON.parse(scriptTag.textContent));
      this.notify(bibliography);
    } else {
      console.warn('Unsupported bibliography script tag type: ' + scriptTag.type);
    }
  }

  notify(bibliography) {
    const options = { detail: bibliography, bubbles: true };
    const event = new CustomEvent('onBibliographyChanged', options);
    this.dispatchEvent(event);
  }

  /* observe 'src' attribute */

  static get observedAttributes() {
    return ['src'];
  }

  receivedBibtex(event) {
    const bibliography = parseBibtex(event.target.response);
    this.notify(bibliography);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    var oReq = new XMLHttpRequest();
    oReq.onload = (e) => this.receivedBibtex(e);
    oReq.onerror = () => console.warn(`Could not load Bibtex! (tried ${newValue})`);
    oReq.responseType = 'text';
    oReq.open('GET', newValue, true);
    oReq.send();
  }


}

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// import style from '../styles/d-byline.css';

function bylineTemplate(frontMatter) {
  return `
  <div class="byline grid">
    <div class="authors-affiliations grid">
      <h3>Authors</h3>
      <h3>Affiliations</h3>
      ${frontMatter.authors.map(author => `
        <p class="author">
          ${author.personalURL ? `
            <a class="name" href="${author.personalURL}">${author.name}</a>` : `
            <span class="name">${author.name}</span>`}
        </p>
        <p class="affiliation">
        ${author.affiliations.map(affiliation =>
          affiliation.url ? `<a class="affiliation" href="${affiliation.url}">${affiliation.name}</a>` : `<span class="affiliation">${affiliation.name}</span>`
        ).join(', ')}
        </p>
      `).join('')}
    </div>
    <div>
      <h3>Published</h3>
      ${frontMatter.publishedDate ? `
        <p>${frontMatter.publishedMonth} ${frontMatter.publishedDay}, ${frontMatter.publishedYear}</p> ` : `
        <p><em>Not published yet.</em></p>`}
    </div>
    <div>
      <h3>DOI</h3>
      ${frontMatter.doi ? `
        <p><a href="https://doi.org/${frontMatter.doi}">${frontMatter.doi}</a></p>` : `
        <p><em>No DOI yet.</em></p>`}
    </div>
  </div>
`;
}

class Byline extends HTMLElement {

  static get is() { return 'd-byline'; }

  set frontMatter(frontMatter) {
    this.innerHTML = bylineTemplate(frontMatter);
  }

}

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const T$3 = Template('d-cite', `
<style>

:host {
  display: inline-block;
}

.citation {
  color: hsla(206, 90%, 20%, 0.7);
}

.citation-number {
  cursor: default;
  white-space: nowrap;
  font-family: -apple-system, BlinkMacSystemFont, "Roboto", Helvetica, sans-serif;
  font-size: 75%;
  color: hsla(206, 90%, 20%, 0.7);
  display: inline-block;
  line-height: 1.1em;
  text-align: center;
  position: relative;
  top: -2px;
  margin: 0 2px;
}

figcaption .citation-number {
  font-size: 11px;
  font-weight: normal;
  top: -2px;
  line-height: 1em;
}

ul {
  margin: 0;
  padding: 0;
  list-style-type: none;
}

ul li {
  padding: 15px 10px 15px 10px;
  border-bottom: 1px solid rgba(0,0,0,0.1)
}

ul li:last-of-type {
  border-bottom: none;
}

</style>

<d-hover-box id="hover-box"></d-hover-box>

<div id="citation-" class="citation">
  <span class="citation-number"></span>
</div>
`);

class Cite extends T$3(HTMLElement) {

  /* Lifecycle */
  constructor() {
    super();
    this._numbers = [];
    this._entries = [];
  }

  connectedCallback() {
    this.outerSpan = this.root.querySelector('#citation-');
    this.innerSpan = this.root.querySelector('.citation-number');
    this.hoverBox = this.root.querySelector('d-hover-box');
    window.customElements.whenDefined('d-hover-box').then(() => {
      this.hoverBox.listen(this);
    });
    // in case this component got connected after values were set
    if (this.numbers) {
      this.displayNumbers(this.numbers);
    }
    if (this.entries) {
      this.displayEntries(this.entries);
    }
  }

  //TODO This causes an infinite loop on firefox with polyfills.
  // This is only needed for interactive editing so no priority.
  // disconnectedCallback() {
    // const options = { detail: [this, this.keys], bubbles: true };
    // const event = new CustomEvent('onCiteKeyRemoved', options);
    // document.dispatchEvent(event);
  // }

  /* observe 'key' attribute */

  static get observedAttributes() {
    return ['key'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    const eventName = oldValue ? 'onCiteKeyChanged' : 'onCiteKeyCreated';
    const keys = newValue.split(',').map(k => k.trim());
    const options = { detail: [this, keys], bubbles: true };
    const event = new CustomEvent(eventName, options);
    document.dispatchEvent(event);
  }

  set key(value) {
    this.setAttribute('key', value);
  }

  get key() {
    return this.getAttribute('key');
  }

  get keys() {
    return this.getAttribute('key').split(',');
  }

  /* Setters & Rendering */

  set numbers(numbers) {
    this._numbers = numbers;
    this.displayNumbers(numbers);
  }

  get numbers() {
    return this._numbers;
  }

  displayNumbers(numbers) {
    if (!this.innerSpan) { return; }
    const numberStrings = numbers.map( index => {
      return index == -1 ? '?' : index + 1 + '';
    });
    const textContent = '[' + numberStrings.join(', ') + ']';
    this.innerSpan.textContent = textContent;
  }

  set entries(entries) {
    this._entries = entries;
    this.displayEntries(entries);
  }

  get entries() {
    return this._entries;
  }

  displayEntries(entries) {
    if (!this.hoverBox) { return }
    this.hoverBox.innerHTML = `<ul>
      ${entries.map(hover_cite).map(html => `<li>${html}</li>`).join('\n')}
    </ul>`;
  }

}

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const styles$1 = `
d-citation-list {
  contain: style;
}

d-citation-list .references {
  grid-column: text;
}

d-citation-list .references .title {
  font-weight: 500;
}
`;

function renderCitationList(element, entries, dom=document) {
  if (entries.size > 0) {
    element.style.display = '';
    let list = element.querySelector('.references');
    if (list) {
      list.innerHTML = '';
    } else {
      const stylesTag = dom.createElement('style');
      stylesTag.innerHTML = styles$1;
      element.appendChild(stylesTag);

      const heading = dom.createElement('h3');
      heading.id = 'references';
      heading.textContent = 'References';
      element.appendChild(heading);

      list = dom.createElement('ol');
      list.id = 'references-list';
      list.className = 'references';
      element.appendChild(list);
    }

    for (const [key, entry] of entries) {
      const listItem = dom.createElement('li');
      listItem.id = key;
      listItem.innerHTML = bibliography_cite(entry);
      list.appendChild(listItem);
    }
  } else {
    element.style.display = 'none';
  }
}

class CitationList extends HTMLElement {

  static get is() { return 'd-citation-list'; }

  connectedCallback() {
    if (!this.hasAttribute('distill-prerendered')) {
      this.style.display = 'none';
    }
  }

  set citations(citations) {
    renderCitationList(this, citations);
  }

}

var prism = createCommonjsModule(function (module) {
/* **********************************************
     Begin prism-core.js
********************************************** */

var _self = (typeof window !== 'undefined')
	? window   // if in browser
	: (
		(typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
		? self // if in worker
		: {}   // if in node js
	);

/**
 * Prism: Lightweight, robust, elegant syntax highlighting
 * MIT license http://www.opensource.org/licenses/mit-license.php/
 * @author Lea Verou http://lea.verou.me
 */

var Prism = (function(){

// Private helper vars
var lang = /\blang(?:uage)?-(\w+)\b/i;
var uniqueId = 0;

var _ = _self.Prism = {
	util: {
		encode: function (tokens) {
			if (tokens instanceof Token) {
				return new Token(tokens.type, _.util.encode(tokens.content), tokens.alias);
			} else if (_.util.type(tokens) === 'Array') {
				return tokens.map(_.util.encode);
			} else {
				return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
			}
		},

		type: function (o) {
			return Object.prototype.toString.call(o).match(/\[object (\w+)\]/)[1];
		},

		objId: function (obj) {
			if (!obj['__id']) {
				Object.defineProperty(obj, '__id', { value: ++uniqueId });
			}
			return obj['__id'];
		},

		// Deep clone a language definition (e.g. to extend it)
		clone: function (o) {
			var type = _.util.type(o);

			switch (type) {
				case 'Object':
					var clone = {};

					for (var key in o) {
						if (o.hasOwnProperty(key)) {
							clone[key] = _.util.clone(o[key]);
						}
					}

					return clone;

				case 'Array':
					// Check for existence for IE8
					return o.map && o.map(function(v) { return _.util.clone(v); });
			}

			return o;
		}
	},

	languages: {
		extend: function (id, redef) {
			var lang = _.util.clone(_.languages[id]);

			for (var key in redef) {
				lang[key] = redef[key];
			}

			return lang;
		},

		/**
		 * Insert a token before another token in a language literal
		 * As this needs to recreate the object (we cannot actually insert before keys in object literals),
		 * we cannot just provide an object, we need anobject and a key.
		 * @param inside The key (or language id) of the parent
		 * @param before The key to insert before. If not provided, the function appends instead.
		 * @param insert Object with the key/value pairs to insert
		 * @param root The object that contains `inside`. If equal to Prism.languages, it can be omitted.
		 */
		insertBefore: function (inside, before, insert, root) {
			root = root || _.languages;
			var grammar = root[inside];

			if (arguments.length == 2) {
				insert = arguments[1];

				for (var newToken in insert) {
					if (insert.hasOwnProperty(newToken)) {
						grammar[newToken] = insert[newToken];
					}
				}

				return grammar;
			}

			var ret = {};

			for (var token in grammar) {

				if (grammar.hasOwnProperty(token)) {

					if (token == before) {

						for (var newToken in insert) {

							if (insert.hasOwnProperty(newToken)) {
								ret[newToken] = insert[newToken];
							}
						}
					}

					ret[token] = grammar[token];
				}
			}

			// Update references in other language definitions
			_.languages.DFS(_.languages, function(key, value) {
				if (value === root[inside] && key != inside) {
					this[key] = ret;
				}
			});

			return root[inside] = ret;
		},

		// Traverse a language definition with Depth First Search
		DFS: function(o, callback, type, visited) {
			visited = visited || {};
			for (var i in o) {
				if (o.hasOwnProperty(i)) {
					callback.call(o, i, o[i], type || i);

					if (_.util.type(o[i]) === 'Object' && !visited[_.util.objId(o[i])]) {
						visited[_.util.objId(o[i])] = true;
						_.languages.DFS(o[i], callback, null, visited);
					}
					else if (_.util.type(o[i]) === 'Array' && !visited[_.util.objId(o[i])]) {
						visited[_.util.objId(o[i])] = true;
						_.languages.DFS(o[i], callback, i, visited);
					}
				}
			}
		}
	},
	plugins: {},

	highlightAll: function(async, callback) {
		var env = {
			callback: callback,
			selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
		};

		_.hooks.run("before-highlightall", env);

		var elements = env.elements || document.querySelectorAll(env.selector);

		for (var i=0, element; element = elements[i++];) {
			_.highlightElement(element, async === true, env.callback);
		}
	},

	highlightElement: function(element, async, callback) {
		// Find language
		var language, grammar, parent = element;

		while (parent && !lang.test(parent.className)) {
			parent = parent.parentNode;
		}

		if (parent) {
			language = (parent.className.match(lang) || [,''])[1].toLowerCase();
			grammar = _.languages[language];
		}

		// Set language on the element, if not present
		element.className = element.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;

		// Set language on the parent, for styling
		parent = element.parentNode;

		if (/pre/i.test(parent.nodeName)) {
			parent.className = parent.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;
		}

		var code = element.textContent;

		var env = {
			element: element,
			language: language,
			grammar: grammar,
			code: code
		};

		_.hooks.run('before-sanity-check', env);

		if (!env.code || !env.grammar) {
			if (env.code) {
				env.element.textContent = env.code;
			}
			_.hooks.run('complete', env);
			return;
		}

		_.hooks.run('before-highlight', env);

		if (async && _self.Worker) {
			var worker = new Worker(_.filename);

			worker.onmessage = function(evt) {
				env.highlightedCode = evt.data;

				_.hooks.run('before-insert', env);

				env.element.innerHTML = env.highlightedCode;

				callback && callback.call(env.element);
				_.hooks.run('after-highlight', env);
				_.hooks.run('complete', env);
			};

			worker.postMessage(JSON.stringify({
				language: env.language,
				code: env.code,
				immediateClose: true
			}));
		}
		else {
			env.highlightedCode = _.highlight(env.code, env.grammar, env.language);

			_.hooks.run('before-insert', env);

			env.element.innerHTML = env.highlightedCode;

			callback && callback.call(element);

			_.hooks.run('after-highlight', env);
			_.hooks.run('complete', env);
		}
	},

	highlight: function (text, grammar, language) {
		var tokens = _.tokenize(text, grammar);
		return Token.stringify(_.util.encode(tokens), language);
	},

	tokenize: function(text, grammar, language) {
		var Token = _.Token;

		var strarr = [text];

		var rest = grammar.rest;

		if (rest) {
			for (var token in rest) {
				grammar[token] = rest[token];
			}

			delete grammar.rest;
		}

		tokenloop: for (var token in grammar) {
			if(!grammar.hasOwnProperty(token) || !grammar[token]) {
				continue;
			}

			var patterns = grammar[token];
			patterns = (_.util.type(patterns) === "Array") ? patterns : [patterns];

			for (var j = 0; j < patterns.length; ++j) {
				var pattern = patterns[j],
					inside = pattern.inside,
					lookbehind = !!pattern.lookbehind,
					greedy = !!pattern.greedy,
					lookbehindLength = 0,
					alias = pattern.alias;

				if (greedy && !pattern.pattern.global) {
					// Without the global flag, lastIndex won't work
					var flags = pattern.pattern.toString().match(/[imuy]*$/)[0];
					pattern.pattern = RegExp(pattern.pattern.source, flags + "g");
				}

				pattern = pattern.pattern || pattern;

				// Don’t cache length as it changes during the loop
				for (var i=0, pos = 0; i<strarr.length; pos += strarr[i].length, ++i) {

					var str = strarr[i];

					if (strarr.length > text.length) {
						// Something went terribly wrong, ABORT, ABORT!
						break tokenloop;
					}

					if (str instanceof Token) {
						continue;
					}

					pattern.lastIndex = 0;

					var match = pattern.exec(str),
					    delNum = 1;

					// Greedy patterns can override/remove up to two previously matched tokens
					if (!match && greedy && i != strarr.length - 1) {
						pattern.lastIndex = pos;
						match = pattern.exec(text);
						if (!match) {
							break;
						}

						var from = match.index + (lookbehind ? match[1].length : 0),
						    to = match.index + match[0].length,
						    k = i,
						    p = pos;

						for (var len = strarr.length; k < len && p < to; ++k) {
							p += strarr[k].length;
							// Move the index i to the element in strarr that is closest to from
							if (from >= p) {
								++i;
								pos = p;
							}
						}

						/*
						 * If strarr[i] is a Token, then the match starts inside another Token, which is invalid
						 * If strarr[k - 1] is greedy we are in conflict with another greedy pattern
						 */
						if (strarr[i] instanceof Token || strarr[k - 1].greedy) {
							continue;
						}

						// Number of tokens to delete and replace with the new match
						delNum = k - i;
						str = text.slice(pos, p);
						match.index -= pos;
					}

					if (!match) {
						continue;
					}

					if(lookbehind) {
						lookbehindLength = match[1].length;
					}

					var from = match.index + lookbehindLength,
					    match = match[0].slice(lookbehindLength),
					    to = from + match.length,
					    before = str.slice(0, from),
					    after = str.slice(to);

					var args = [i, delNum];

					if (before) {
						args.push(before);
					}

					var wrapped = new Token(token, inside? _.tokenize(match, inside) : match, alias, match, greedy);

					args.push(wrapped);

					if (after) {
						args.push(after);
					}

					Array.prototype.splice.apply(strarr, args);
				}
			}
		}

		return strarr;
	},

	hooks: {
		all: {},

		add: function (name, callback) {
			var hooks = _.hooks.all;

			hooks[name] = hooks[name] || [];

			hooks[name].push(callback);
		},

		run: function (name, env) {
			var callbacks = _.hooks.all[name];

			if (!callbacks || !callbacks.length) {
				return;
			}

			for (var i=0, callback; callback = callbacks[i++];) {
				callback(env);
			}
		}
	}
};

var Token = _.Token = function(type, content, alias, matchedStr, greedy) {
	this.type = type;
	this.content = content;
	this.alias = alias;
	// Copy of the full string this token was created from
	this.length = (matchedStr || "").length|0;
	this.greedy = !!greedy;
};

Token.stringify = function(o, language, parent) {
	if (typeof o == 'string') {
		return o;
	}

	if (_.util.type(o) === 'Array') {
		return o.map(function(element) {
			return Token.stringify(element, language, o);
		}).join('');
	}

	var env = {
		type: o.type,
		content: Token.stringify(o.content, language, parent),
		tag: 'span',
		classes: ['token', o.type],
		attributes: {},
		language: language,
		parent: parent
	};

	if (env.type == 'comment') {
		env.attributes['spellcheck'] = 'true';
	}

	if (o.alias) {
		var aliases = _.util.type(o.alias) === 'Array' ? o.alias : [o.alias];
		Array.prototype.push.apply(env.classes, aliases);
	}

	_.hooks.run('wrap', env);

	var attributes = Object.keys(env.attributes).map(function(name) {
		return name + '="' + (env.attributes[name] || '').replace(/"/g, '&quot;') + '"';
	}).join(' ');

	return '<' + env.tag + ' class="' + env.classes.join(' ') + '"' + (attributes ? ' ' + attributes : '') + '>' + env.content + '</' + env.tag + '>';

};

if (!_self.document) {
	if (!_self.addEventListener) {
		// in Node.js
		return _self.Prism;
	}
 	// In worker
	_self.addEventListener('message', function(evt) {
		var message = JSON.parse(evt.data),
		    lang = message.language,
		    code = message.code,
		    immediateClose = message.immediateClose;

		_self.postMessage(_.highlight(code, _.languages[lang], lang));
		if (immediateClose) {
			_self.close();
		}
	}, false);

	return _self.Prism;
}

//Get current script and highlight
var script = document.currentScript || [].slice.call(document.getElementsByTagName("script")).pop();

if (script) {
	_.filename = script.src;

	if (document.addEventListener && !script.hasAttribute('data-manual')) {
		if(document.readyState !== "loading") {
			if (window.requestAnimationFrame) {
				window.requestAnimationFrame(_.highlightAll);
			} else {
				window.setTimeout(_.highlightAll, 16);
			}
		}
		else {
			document.addEventListener('DOMContentLoaded', _.highlightAll);
		}
	}
}

return _self.Prism;

})();

if ('object' !== 'undefined' && module.exports) {
	module.exports = Prism;
}

// hack for components to work correctly in node.js
if (typeof commonjsGlobal !== 'undefined') {
	commonjsGlobal.Prism = Prism;
}


/* **********************************************
     Begin prism-markup.js
********************************************** */

Prism.languages.markup = {
	'comment': /<!--[\w\W]*?-->/,
	'prolog': /<\?[\w\W]+?\?>/,
	'doctype': /<!DOCTYPE[\w\W]+?>/i,
	'cdata': /<!\[CDATA\[[\w\W]*?]]>/i,
	'tag': {
		pattern: /<\/?(?!\d)[^\s>\/=$<]+(?:\s+[^\s>\/=]+(?:=(?:("|')(?:\\\1|\\?(?!\1)[\w\W])*\1|[^\s'">=]+))?)*\s*\/?>/i,
		inside: {
			'tag': {
				pattern: /^<\/?[^\s>\/]+/i,
				inside: {
					'punctuation': /^<\/?/,
					'namespace': /^[^\s>\/:]+:/
				}
			},
			'attr-value': {
				pattern: /=(?:('|")[\w\W]*?(\1)|[^\s>]+)/i,
				inside: {
					'punctuation': /[=>"']/
				}
			},
			'punctuation': /\/?>/,
			'attr-name': {
				pattern: /[^\s>\/]+/,
				inside: {
					'namespace': /^[^\s>\/:]+:/
				}
			}

		}
	},
	'entity': /&#?[\da-z]{1,8};/i
};

// Plugin to make entity title show the real entity, idea by Roman Komarov
Prism.hooks.add('wrap', function(env) {

	if (env.type === 'entity') {
		env.attributes['title'] = env.content.replace(/&amp;/, '&');
	}
});

Prism.languages.xml = Prism.languages.markup;
Prism.languages.html = Prism.languages.markup;
Prism.languages.mathml = Prism.languages.markup;
Prism.languages.svg = Prism.languages.markup;


/* **********************************************
     Begin prism-css.js
********************************************** */

Prism.languages.css = {
	'comment': /\/\*[\w\W]*?\*\//,
	'atrule': {
		pattern: /@[\w-]+?.*?(;|(?=\s*\{))/i,
		inside: {
			'rule': /@[\w-]+/
			// See rest below
		}
	},
	'url': /url\((?:(["'])(\\(?:\r\n|[\w\W])|(?!\1)[^\\\r\n])*\1|.*?)\)/i,
	'selector': /[^\{\}\s][^\{\};]*?(?=\s*\{)/,
	'string': {
		pattern: /("|')(\\(?:\r\n|[\w\W])|(?!\1)[^\\\r\n])*\1/,
		greedy: true
	},
	'property': /(\b|\B)[\w-]+(?=\s*:)/i,
	'important': /\B!important\b/i,
	'function': /[-a-z0-9]+(?=\()/i,
	'punctuation': /[(){};:]/
};

Prism.languages.css['atrule'].inside.rest = Prism.util.clone(Prism.languages.css);

if (Prism.languages.markup) {
	Prism.languages.insertBefore('markup', 'tag', {
		'style': {
			pattern: /(<style[\w\W]*?>)[\w\W]*?(?=<\/style>)/i,
			lookbehind: true,
			inside: Prism.languages.css,
			alias: 'language-css'
		}
	});
	
	Prism.languages.insertBefore('inside', 'attr-value', {
		'style-attr': {
			pattern: /\s*style=("|').*?\1/i,
			inside: {
				'attr-name': {
					pattern: /^\s*style/i,
					inside: Prism.languages.markup.tag.inside
				},
				'punctuation': /^\s*=\s*['"]|['"]\s*$/,
				'attr-value': {
					pattern: /.+/i,
					inside: Prism.languages.css
				}
			},
			alias: 'language-css'
		}
	}, Prism.languages.markup.tag);
}

/* **********************************************
     Begin prism-clike.js
********************************************** */

Prism.languages.clike = {
	'comment': [
		{
			pattern: /(^|[^\\])\/\*[\w\W]*?\*\//,
			lookbehind: true
		},
		{
			pattern: /(^|[^\\:])\/\/.*/,
			lookbehind: true
		}
	],
	'string': {
		pattern: /(["'])(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
		greedy: true
	},
	'class-name': {
		pattern: /((?:\b(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[a-z0-9_\.\\]+/i,
		lookbehind: true,
		inside: {
			punctuation: /(\.|\\)/
		}
	},
	'keyword': /\b(if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
	'boolean': /\b(true|false)\b/,
	'function': /[a-z0-9_]+(?=\()/i,
	'number': /\b-?(?:0x[\da-f]+|\d*\.?\d+(?:e[+-]?\d+)?)\b/i,
	'operator': /--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*|\/|~|\^|%/,
	'punctuation': /[{}[\];(),.:]/
};


/* **********************************************
     Begin prism-javascript.js
********************************************** */

Prism.languages.javascript = Prism.languages.extend('clike', {
	'keyword': /\b(as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/,
	'number': /\b-?(0x[\dA-Fa-f]+|0b[01]+|0o[0-7]+|\d*\.?\d+([Ee][+-]?\d+)?|NaN|Infinity)\b/,
	// Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
	'function': /[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*(?=\()/i,
	'operator': /--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*\*?|\/|~|\^|%|\.{3}/
});

Prism.languages.insertBefore('javascript', 'keyword', {
	'regex': {
		pattern: /(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\\\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})]))/,
		lookbehind: true,
		greedy: true
	}
});

Prism.languages.insertBefore('javascript', 'string', {
	'template-string': {
		pattern: /`(?:\\\\|\\?[^\\])*?`/,
		greedy: true,
		inside: {
			'interpolation': {
				pattern: /\$\{[^}]+\}/,
				inside: {
					'interpolation-punctuation': {
						pattern: /^\$\{|\}$/,
						alias: 'punctuation'
					},
					rest: Prism.languages.javascript
				}
			},
			'string': /[\s\S]+/
		}
	}
});

if (Prism.languages.markup) {
	Prism.languages.insertBefore('markup', 'tag', {
		'script': {
			pattern: /(<script[\w\W]*?>)[\w\W]*?(?=<\/script>)/i,
			lookbehind: true,
			inside: Prism.languages.javascript,
			alias: 'language-javascript'
		}
	});
}

Prism.languages.js = Prism.languages.javascript;

/* **********************************************
     Begin prism-file-highlight.js
********************************************** */

(function () {
	if (typeof self === 'undefined' || !self.Prism || !self.document || !document.querySelector) {
		return;
	}

	self.Prism.fileHighlight = function() {

		var Extensions = {
			'js': 'javascript',
			'py': 'python',
			'rb': 'ruby',
			'ps1': 'powershell',
			'psm1': 'powershell',
			'sh': 'bash',
			'bat': 'batch',
			'h': 'c',
			'tex': 'latex'
		};

		if(Array.prototype.forEach) { // Check to prevent error in IE8
			Array.prototype.slice.call(document.querySelectorAll('pre[data-src]')).forEach(function (pre) {
				var src = pre.getAttribute('data-src');

				var language, parent = pre;
				var lang = /\blang(?:uage)?-(?!\*)(\w+)\b/i;
				while (parent && !lang.test(parent.className)) {
					parent = parent.parentNode;
				}

				if (parent) {
					language = (pre.className.match(lang) || [, ''])[1];
				}

				if (!language) {
					var extension = (src.match(/\.(\w+)$/) || [, ''])[1];
					language = Extensions[extension] || extension;
				}

				var code = document.createElement('code');
				code.className = 'language-' + language;

				pre.textContent = '';

				code.textContent = 'Loading…';

				pre.appendChild(code);

				var xhr = new XMLHttpRequest();

				xhr.open('GET', src, true);

				xhr.onreadystatechange = function () {
					if (xhr.readyState == 4) {

						if (xhr.status < 400 && xhr.responseText) {
							code.textContent = xhr.responseText;

							Prism.highlightElement(code);
						}
						else if (xhr.status >= 400) {
							code.textContent = '✖ Error ' + xhr.status + ' while fetching file: ' + xhr.statusText;
						}
						else {
							code.textContent = '✖ Error: File does not exist or is empty';
						}
					}
				};

				xhr.send(null);
			});
		}

	};

	document.addEventListener('DOMContentLoaded', self.Prism.fileHighlight);

})();
});

Prism.languages.python= {
	'triple-quoted-string': {
		pattern: /"""[\s\S]+?"""|'''[\s\S]+?'''/,
		alias: 'string'
	},
	'comment': {
		pattern: /(^|[^\\])#.*/,
		lookbehind: true
	},
	'string': {
		pattern: /("|')(?:\\\\|\\?[^\\\r\n])*?\1/,
		greedy: true
	},
	'function' : {
		pattern: /((?:^|\s)def[ \t]+)[a-zA-Z_][a-zA-Z0-9_]*(?=\()/g,
		lookbehind: true
	},
	'class-name': {
		pattern: /(\bclass\s+)[a-z0-9_]+/i,
		lookbehind: true
	},
	'keyword' : /\b(?:as|assert|async|await|break|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|pass|print|raise|return|try|while|with|yield)\b/,
	'boolean' : /\b(?:True|False)\b/,
	'number' : /\b-?(?:0[bo])?(?:(?:\d|0x[\da-f])[\da-f]*\.?\d*|\.\d+)(?:e[+-]?\d+)?j?\b/i,
	'operator' : /[-+%=]=?|!=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]|\b(?:or|and|not)\b/,
	'punctuation' : /[{}[\];(),.:]/
};

Prism.languages.clike = {
	'comment': [
		{
			pattern: /(^|[^\\])\/\*[\w\W]*?\*\//,
			lookbehind: true
		},
		{
			pattern: /(^|[^\\:])\/\/.*/,
			lookbehind: true
		}
	],
	'string': {
		pattern: /(["'])(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
		greedy: true
	},
	'class-name': {
		pattern: /((?:\b(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[a-z0-9_\.\\]+/i,
		lookbehind: true,
		inside: {
			punctuation: /(\.|\\)/
		}
	},
	'keyword': /\b(if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
	'boolean': /\b(true|false)\b/,
	'function': /[a-z0-9_]+(?=\()/i,
	'number': /\b-?(?:0x[\da-f]+|\d*\.?\d+(?:e[+-]?\d+)?)\b/i,
	'operator': /--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*|\/|~|\^|%/,
	'punctuation': /[{}[\];(),.:]/
};

Prism.languages.lua = {
	'comment': /^#!.+|--(?:\[(=*)\[[\s\S]*?\]\1\]|.*)/m,
	// \z may be used to skip the following space
	'string': {
		pattern: /(["'])(?:(?!\1)[^\\\r\n]|\\z(?:\r\n|\s)|\\(?:\r\n|[\s\S]))*\1|\[(=*)\[[\s\S]*?\]\2\]/,
		greedy: true
	},
	'number': /\b0x[a-f\d]+\.?[a-f\d]*(?:p[+-]?\d+)?\b|\b\d+(?:\.\B|\.?\d*(?:e[+-]?\d+)?\b)|\B\.\d+(?:e[+-]?\d+)?\b/i,
	'keyword': /\b(?:and|break|do|else|elseif|end|false|for|function|goto|if|in|local|nil|not|or|repeat|return|then|true|until|while)\b/,
	'function': /(?!\d)\w+(?=\s*(?:[({]))/,
	'operator': [
		/[-+*%^&|#]|\/\/?|<[<=]?|>[>=]?|[=~]=?/,
		{
			// Match ".." but don't break "..."
			pattern: /(^|[^.])\.\.(?!\.)/,
			lookbehind: true
		}
	],
	'punctuation': /[\[\](){},;]|\.+|:+/
};

(function(Prism) {
	var insideString = {
		variable: [
			// Arithmetic Environment
			{
				pattern: /\$?\(\([\w\W]+?\)\)/,
				inside: {
					// If there is a $ sign at the beginning highlight $(( and )) as variable
					variable: [{
							pattern: /(^\$\(\([\w\W]+)\)\)/,
							lookbehind: true
						},
						/^\$\(\(/,
					],
					number: /\b-?(?:0x[\dA-Fa-f]+|\d*\.?\d+(?:[Ee]-?\d+)?)\b/,
					// Operators according to https://www.gnu.org/software/bash/manual/bashref.html#Shell-Arithmetic
					operator: /--?|-=|\+\+?|\+=|!=?|~|\*\*?|\*=|\/=?|%=?|<<=?|>>=?|<=?|>=?|==?|&&?|&=|\^=?|\|\|?|\|=|\?|:/,
					// If there is no $ sign at the beginning highlight (( and )) as punctuation
					punctuation: /\(\(?|\)\)?|,|;/
				}
			},
			// Command Substitution
			{
				pattern: /\$\([^)]+\)|`[^`]+`/,
				inside: {
					variable: /^\$\(|^`|\)$|`$/
				}
			},
			/\$(?:[a-z0-9_#\?\*!@]+|\{[^}]+\})/i
		],
	};

	Prism.languages.bash = {
		'shebang': {
			pattern: /^#!\s*\/bin\/bash|^#!\s*\/bin\/sh/,
			alias: 'important'
		},
		'comment': {
			pattern: /(^|[^"{\\])#.*/,
			lookbehind: true
		},
		'string': [
			//Support for Here-Documents https://en.wikipedia.org/wiki/Here_document
			{
				pattern: /((?:^|[^<])<<\s*)(?:"|')?(\w+?)(?:"|')?\s*\r?\n(?:[\s\S])*?\r?\n\2/g,
				lookbehind: true,
				greedy: true,
				inside: insideString
			},
			{
				pattern: /(["'])(?:\\\\|\\?[^\\])*?\1/g,
				greedy: true,
				inside: insideString
			}
		],
		'variable': insideString.variable,
		// Originally based on http://ss64.com/bash/
		'function': {
			pattern: /(^|\s|;|\||&)(?:alias|apropos|apt-get|aptitude|aspell|awk|basename|bash|bc|bg|builtin|bzip2|cal|cat|cd|cfdisk|chgrp|chmod|chown|chroot|chkconfig|cksum|clear|cmp|comm|command|cp|cron|crontab|csplit|cut|date|dc|dd|ddrescue|df|diff|diff3|dig|dir|dircolors|dirname|dirs|dmesg|du|egrep|eject|enable|env|ethtool|eval|exec|expand|expect|export|expr|fdformat|fdisk|fg|fgrep|file|find|fmt|fold|format|free|fsck|ftp|fuser|gawk|getopts|git|grep|groupadd|groupdel|groupmod|groups|gzip|hash|head|help|hg|history|hostname|htop|iconv|id|ifconfig|ifdown|ifup|import|install|jobs|join|kill|killall|less|link|ln|locate|logname|logout|look|lpc|lpr|lprint|lprintd|lprintq|lprm|ls|lsof|make|man|mkdir|mkfifo|mkisofs|mknod|more|most|mount|mtools|mtr|mv|mmv|nano|netstat|nice|nl|nohup|notify-send|npm|nslookup|open|op|passwd|paste|pathchk|ping|pkill|popd|pr|printcap|printenv|printf|ps|pushd|pv|pwd|quota|quotacheck|quotactl|ram|rar|rcp|read|readarray|readonly|reboot|rename|renice|remsync|rev|rm|rmdir|rsync|screen|scp|sdiff|sed|seq|service|sftp|shift|shopt|shutdown|sleep|slocate|sort|source|split|ssh|stat|strace|su|sudo|sum|suspend|sync|tail|tar|tee|test|time|timeout|times|touch|top|traceroute|trap|tr|tsort|tty|type|ulimit|umask|umount|unalias|uname|unexpand|uniq|units|unrar|unshar|uptime|useradd|userdel|usermod|users|uuencode|uudecode|v|vdir|vi|vmstat|wait|watch|wc|wget|whereis|which|who|whoami|write|xargs|xdg-open|yes|zip)(?=$|\s|;|\||&)/,
			lookbehind: true
		},
		'keyword': {
			pattern: /(^|\s|;|\||&)(?:let|:|\.|if|then|else|elif|fi|for|break|continue|while|in|case|function|select|do|done|until|echo|exit|return|set|declare)(?=$|\s|;|\||&)/,
			lookbehind: true
		},
		'boolean': {
			pattern: /(^|\s|;|\||&)(?:true|false)(?=$|\s|;|\||&)/,
			lookbehind: true
		},
		'operator': /&&?|\|\|?|==?|!=?|<<<?|>>|<=?|>=?|=~/,
		'punctuation': /\$?\(\(?|\)\)?|\.\.|[{}[\];]/
	};

	var inside = insideString.variable[1].inside;
	inside['function'] = Prism.languages.bash['function'];
	inside.keyword = Prism.languages.bash.keyword;
	inside.boolean = Prism.languages.bash.boolean;
	inside.operator = Prism.languages.bash.operator;
	inside.punctuation = Prism.languages.bash.punctuation;
})(Prism);

Prism.languages.go = Prism.languages.extend('clike', {
	'keyword': /\b(break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go(to)?|if|import|interface|map|package|range|return|select|struct|switch|type|var)\b/,
	'builtin': /\b(bool|byte|complex(64|128)|error|float(32|64)|rune|string|u?int(8|16|32|64|)|uintptr|append|cap|close|complex|copy|delete|imag|len|make|new|panic|print(ln)?|real|recover)\b/,
	'boolean': /\b(_|iota|nil|true|false)\b/,
	'operator': /[*\/%^!=]=?|\+[=+]?|-[=-]?|\|[=|]?|&(?:=|&|\^=?)?|>(?:>=?|=)?|<(?:<=?|=|-)?|:=|\.\.\./,
	'number': /\b(-?(0x[a-f\d]+|(\d+\.?\d*|\.\d+)(e[-+]?\d+)?)i?)\b/i,
	'string': /("|'|`)(\\?.|\r|\n)*?\1/
});
delete Prism.languages.go['class-name'];

Prism.languages.markdown = Prism.languages.extend('markup', {});
Prism.languages.insertBefore('markdown', 'prolog', {
	'blockquote': {
		// > ...
		pattern: /^>(?:[\t ]*>)*/m,
		alias: 'punctuation'
	},
	'code': [
		{
			// Prefixed by 4 spaces or 1 tab
			pattern: /^(?: {4}|\t).+/m,
			alias: 'keyword'
		},
		{
			// `code`
			// ``code``
			pattern: /``.+?``|`[^`\n]+`/,
			alias: 'keyword'
		}
	],
	'title': [
		{
			// title 1
			// =======

			// title 2
			// -------
			pattern: /\w+.*(?:\r?\n|\r)(?:==+|--+)/,
			alias: 'important',
			inside: {
				punctuation: /==+$|--+$/
			}
		},
		{
			// # title 1
			// ###### title 6
			pattern: /(^\s*)#+.+/m,
			lookbehind: true,
			alias: 'important',
			inside: {
				punctuation: /^#+|#+$/
			}
		}
	],
	'hr': {
		// ***
		// ---
		// * * *
		// -----------
		pattern: /(^\s*)([*-])([\t ]*\2){2,}(?=\s*$)/m,
		lookbehind: true,
		alias: 'punctuation'
	},
	'list': {
		// * item
		// + item
		// - item
		// 1. item
		pattern: /(^\s*)(?:[*+-]|\d+\.)(?=[\t ].)/m,
		lookbehind: true,
		alias: 'punctuation'
	},
	'url-reference': {
		// [id]: http://example.com "Optional title"
		// [id]: http://example.com 'Optional title'
		// [id]: http://example.com (Optional title)
		// [id]: <http://example.com> "Optional title"
		pattern: /!?\[[^\]]+\]:[\t ]+(?:\S+|<(?:\\.|[^>\\])+>)(?:[\t ]+(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\)))?/,
		inside: {
			'variable': {
				pattern: /^(!?\[)[^\]]+/,
				lookbehind: true
			},
			'string': /(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\))$/,
			'punctuation': /^[\[\]!:]|[<>]/
		},
		alias: 'url'
	},
	'bold': {
		// **strong**
		// __strong__

		// Allow only one line break
		pattern: /(^|[^\\])(\*\*|__)(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,
		lookbehind: true,
		inside: {
			'punctuation': /^\*\*|^__|\*\*$|__$/
		}
	},
	'italic': {
		// *em*
		// _em_

		// Allow only one line break
		pattern: /(^|[^\\])([*_])(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,
		lookbehind: true,
		inside: {
			'punctuation': /^[*_]|[*_]$/
		}
	},
	'url': {
		// [example](http://example.com "Optional title")
		// [example] [id]
		pattern: /!?\[[^\]]+\](?:\([^\s)]+(?:[\t ]+"(?:\\.|[^"\\])*")?\)| ?\[[^\]\n]*\])/,
		inside: {
			'variable': {
				pattern: /(!?\[)[^\]]+(?=\]$)/,
				lookbehind: true
			},
			'string': {
				pattern: /"(?:\\.|[^"\\])*"(?=\)$)/
			}
		}
	}
});

Prism.languages.markdown['bold'].inside['url'] = Prism.util.clone(Prism.languages.markdown['url']);
Prism.languages.markdown['italic'].inside['url'] = Prism.util.clone(Prism.languages.markdown['url']);
Prism.languages.markdown['bold'].inside['italic'] = Prism.util.clone(Prism.languages.markdown['italic']);
Prism.languages.markdown['italic'].inside['bold'] = Prism.util.clone(Prism.languages.markdown['bold']);

Prism.languages.julia= {
	'comment': {
		pattern: /(^|[^\\])#.*/,
		lookbehind: true
	},
	'string': /"""[\s\S]+?"""|'''[\s\S]+?'''|("|')(\\?.)*?\1/,
	'keyword' : /\b(abstract|baremodule|begin|bitstype|break|catch|ccall|const|continue|do|else|elseif|end|export|finally|for|function|global|if|immutable|import|importall|let|local|macro|module|print|println|quote|return|try|type|typealias|using|while)\b/,
	'boolean' : /\b(true|false)\b/,
	'number' : /\b-?(0[box])?(?:[\da-f]+\.?\d*|\.\d+)(?:[efp][+-]?\d+)?j?\b/i,
	'operator': /\+=?|-=?|\*=?|\/[\/=]?|\\=?|\^=?|%=?|÷=?|!=?=?|&=?|\|[=>]?|\$=?|<(?:<=?|[=:])?|>(?:=|>>?=?)?|==?=?|[~≠≤≥]/,
	'punctuation' : /[{}[\];(),.:]/
};

var css = "/**\n * prism.js default theme for JavaScript, CSS and HTML\n * Based on dabblet (http://dabblet.com)\n * @author Lea Verou\n */\n\ncode[class*=\"language-\"],\npre[class*=\"language-\"] {\n\tcolor: black;\n\tbackground: none;\n\ttext-shadow: 0 1px white;\n\tfont-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;\n\ttext-align: left;\n\twhite-space: pre;\n\tword-spacing: normal;\n\tword-break: normal;\n\tword-wrap: normal;\n\tline-height: 1.5;\n\n\t-moz-tab-size: 4;\n\t-o-tab-size: 4;\n\ttab-size: 4;\n\n\t-webkit-hyphens: none;\n\t-moz-hyphens: none;\n\t-ms-hyphens: none;\n\thyphens: none;\n}\n\npre[class*=\"language-\"]::-moz-selection, pre[class*=\"language-\"] ::-moz-selection,\ncode[class*=\"language-\"]::-moz-selection, code[class*=\"language-\"] ::-moz-selection {\n\ttext-shadow: none;\n\tbackground: #b3d4fc;\n}\n\npre[class*=\"language-\"]::selection, pre[class*=\"language-\"] ::selection,\ncode[class*=\"language-\"]::selection, code[class*=\"language-\"] ::selection {\n\ttext-shadow: none;\n\tbackground: #b3d4fc;\n}\n\n@media print {\n\tcode[class*=\"language-\"],\n\tpre[class*=\"language-\"] {\n\t\ttext-shadow: none;\n\t}\n}\n\n/* Code blocks */\npre[class*=\"language-\"] {\n\tpadding: 1em;\n\tmargin: .5em 0;\n\toverflow: auto;\n}\n\n:not(pre) > code[class*=\"language-\"],\npre[class*=\"language-\"] {\n\tbackground: #f5f2f0;\n}\n\n/* Inline code */\n:not(pre) > code[class*=\"language-\"] {\n\tpadding: .1em;\n\tborder-radius: .3em;\n\twhite-space: normal;\n}\n\n.token.comment,\n.token.prolog,\n.token.doctype,\n.token.cdata {\n\tcolor: slategray;\n}\n\n.token.punctuation {\n\tcolor: #999;\n}\n\n.namespace {\n\topacity: .7;\n}\n\n.token.property,\n.token.tag,\n.token.boolean,\n.token.number,\n.token.constant,\n.token.symbol,\n.token.deleted {\n\tcolor: #905;\n}\n\n.token.selector,\n.token.attr-name,\n.token.string,\n.token.char,\n.token.builtin,\n.token.inserted {\n\tcolor: #690;\n}\n\n.token.operator,\n.token.entity,\n.token.url,\n.language-css .token.string,\n.style .token.string {\n\tcolor: #a67f59;\n\tbackground: hsla(0, 0%, 100%, .5);\n}\n\n.token.atrule,\n.token.attr-value,\n.token.keyword {\n\tcolor: #07a;\n}\n\n.token.function {\n\tcolor: #DD4A68;\n}\n\n.token.regex,\n.token.important,\n.token.variable {\n\tcolor: #e90;\n}\n\n.token.important,\n.token.bold {\n\tfont-weight: bold;\n}\n.token.italic {\n\tfont-style: italic;\n}\n\n.token.entity {\n\tcursor: help;\n}\n";

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const T$4 = Template('d-code', `
<style>

code {
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 2px;
  padding: 4px 7px;
  font-size: 15px;
  color: rgba(0, 0, 0, 0.6);
}

pre code {
  display: block;
  border-left: 2px solid rgba(0, 0, 0, .1);
  padding: 0 0 0 36px;
}

${css}
</style>

<code id="code-container"></code>

`);

class Code extends Mutating(T$4(HTMLElement)) {

  renderContent() {

    // check if language can be highlighted
    this.languageName = this.getAttribute('language');
    if (!this.languageName) {
      console.warn('You need to provide a language attribute to your <d-code> block to let us know how to highlight your code; e.g.:\n <d-code language="python">zeros = np.zeros(shape)</d-code>.');
      return;
    }
    const language = prism.languages[this.languageName];
    if (language == undefined) {
      console.warn(`Distill does not yet support highlighting your code block in "${this.languageName}'.`);
      return;
    }

    let content = this.textContent;
    const codeTag = this.shadowRoot.querySelector('#code-container');

    if (this.hasAttribute('block')) {
      // normalize the tab indents
      content = content.replace(/\n/, '');
      const tabs = content.match(/\s*/);
      content = content.replace(new RegExp('\n' + tabs, 'g'), '\n');
      content = content.trim();
      // wrap code block in pre tag if needed
      if (codeTag.parentNode instanceof ShadowRoot) {
        const preTag = document.createElement('pre');
        this.shadowRoot.removeChild(codeTag);
        preTag.appendChild(codeTag);
        this.shadowRoot.appendChild(preTag);
      }

    }

    codeTag.className = `language-${this.languageName}`;
    codeTag.innerHTML = prism.highlight(content, language);
  }

}

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const T$5 = Template('d-footnote', `
<style>

d-math[block] {
  display: block;
}

:host {

}

sup {
  line-height: 1em;
  font-size: 0.75em;
  position: relative;
  top: -.5em;
  vertical-align: baseline;
}

span {
  color: hsla(206, 90%, 20%, 0.7);
  cursor: default;
}

.footnote-container {
  padding: 10px;
}

</style>

<d-hover-box>
  <div class="footnote-container">
    <slot id="slot"></slot>
  </div>
</d-hover-box>

<sup>
  <span id="fn-" data-hover-ref=""></span>
</sup>

`);

class Footnote extends T$5(HTMLElement) {

  constructor() {
    super();

    const options = {childList: true, characterData: true, subtree: true};
    const observer = new MutationObserver(this.notify);
    observer.observe(this, options);
  }

  notify() {
    const options = { detail: this, bubbles: true };
    const event = new CustomEvent('onFootnoteChanged', options);
    document.dispatchEvent(event);
  }

  connectedCallback() {
    // listen and notify about changes to slotted content
    // const slot = this.shadowRoot.querySelector('#slot');
    // console.warn(slot.textContent);
    // slot.addEventListener('slotchange', this.notify);
    this.hoverBox = this.root.querySelector('d-hover-box');
    window.customElements.whenDefined('d-hover-box').then(() => {
      this.hoverBox.listen(this);
    });
    // create numeric ID
    Footnote.currentFootnoteId += 1;
    const IdString = Footnote.currentFootnoteId.toString();
    this.root.host.id = 'd-footnote-' + IdString;

    // set up hidden hover box
    const id = 'dt-fn-hover-box-' + IdString;
    this.hoverBox.id = id;

    // set up visible footnote marker
    const span = this.root.querySelector('#fn-');
    span.setAttribute('id', 'fn-' + IdString);
    span.setAttribute('data-hover-ref', id);
    span.textContent = IdString;
  }

}

Footnote.currentFootnoteId = 0;

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const T$6 = Template('d-footnote-list', `
<style>

d-footnote-list {
  contain: layout style;
}

d-footnote-list > * {
  grid-column: text;
}

d-footnote-list a.footnote-backlink {
  color: rgba(0,0,0,0.3);
  padding-left: 0.5em;
}

</style>

<h3>Footnotes</h3>
<ol></ol>
`, false);

class FootnoteList extends T$6(HTMLElement) {

  connectedCallback() {
    super.connectedCallback();

    this.list = this.root.querySelector('ol');
    // footnotes list is initially hidden
    this.root.style.display = 'none';
    // look through document and register existing footnotes
    // Store.subscribeTo('footnotes', (footnote) => {
    //   this.renderFootnote(footnote);
    // });
  }

  // TODO: could optimize this to accept individual footnotes?
  set footnotes(footnotes) {
    this.list.innerHTML = '';
    if (footnotes.length) {
      // ensure footnote list is visible
      this.root.style.display = '';

      for (const footnote of footnotes) {
        // construct and append list item to show footnote
        const listItem = document.createElement('li');
        listItem.id = footnote.id + '-listing';
        listItem.innerHTML = footnote.innerHTML;

        const backlink = document.createElement('a');
        backlink.setAttribute('class', 'footnote-backlink');
        backlink.textContent = '[↩]';
        backlink.href = '#' + footnote.id;

        listItem.appendChild(backlink);
        this.list.appendChild(listItem);
      }
    } else {
      // ensure footnote list is invisible
      this.root.style.display = 'none';
    }
  }

}

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const T$7 = Template('d-hover-box', `
<style>

:host {
  position: absolute;
  width: 100%;
  left: 0px;
  z-index: 10000;
  display: none;
  white-space: normal
}

.container {
  position: relative;
  width: 704px;
  max-width: 100vw;
  margin: 0 auto;
}

.panel {
  position: absolute;
  font-size: 1rem;
  line-height: 1.5em;
  top: 0;
  left: 0;
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background-color: rgba(250, 250, 250, 0.95);
  box-shadow: 0 0 7px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  box-sizing: border-box;

  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

</style>

<div class="container">
  <div class="panel">
    <slot></slot>
  </div>
</div>
`);

class HoverBox extends T$7(HTMLElement) {

  constructor() {
    super();
  }

  connectedCallback() {

  }

  listen(element) {
    // console.log(element)
    this.bindDivEvents(this);
    this.bindTriggerEvents(element);
    // this.style.display = "block";
  }

  bindDivEvents(element) {
    // For mice, same behavior as hovering on links
    element.addEventListener('mouseover', () => {
      if (!this.visible) { this.showAtNode(element); }
      this.stopTimeout();
    });
    element.addEventListener('mouseout', () => {
      this.extendTimeout(500);
    });
    // Don't trigger body touchstart event when touching within box
    element.addEventListener('touchstart', (event) => {
      event.stopPropagation();
    }, {passive: true});
    // Close box when touching outside box
    document.body.addEventListener('touchstart', () => {
      this.hide();
    }, {passive: true});
  }

  bindTriggerEvents(node) {
    node.addEventListener('mouseover', () => {
      if (!this.visible) {
        this.showAtNode(node);
      }
      this.stopTimeout();
    });

    node.addEventListener('mouseout', () => {
      this.extendTimeout(300);
    });

    node.addEventListener('touchstart', (event) => {
      if (this.visible) {
        this.hide();
      } else {
        this.showAtNode(node);
      }
      // Don't trigger body touchstart event when touching link
      event.stopPropagation();
    }, {passive: true});
  }

  show(position) {
    this.visible = true;
    this.style.display = 'block';
    // 10px extra offset from element
    this.style.top = Math.round(position[1] + 10) + 'px';
  }

  showAtNode(node) {
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetTop
    const bbox = node.getBoundingClientRect();
    this.show([node.offsetLeft + bbox.width, node.offsetTop + bbox.height]);
  }

  hide() {
    this.visible = false;
    this.style.display = 'none';
    this.stopTimeout();
  }

  stopTimeout() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  extendTimeout(time) {
    this.stopTimeout();
    this.timeout = setTimeout(() => {
      this.hide();
    }, time);
  }

}

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

class Title extends HTMLElement {
  static get is() { return 'd-title'; }
}

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const T$8 = Template('d-references', `
<style>
d-references {
  display: block;
}
</style>
`, false);

class References extends T$8(HTMLElement) {

}

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

class TOC extends HTMLElement {

  static get is() { return 'd-toc'; }

  connectedCallback() {
    if (!this.getAttribute('prerendered')) {
      window.onload = () => {
        const article = document.querySelector('d-article');
        const headings = article.querySelectorAll('h2, h3');
        renderTOC(this, headings);
      };
    }
  }

}

function renderTOC(element, headings) {

  let ToC =`
  <style>

  d-toc {
    contain: layout style;
    display: block;
  }

  d-toc ul {
    padding-left: 0;
  }

  d-toc ul > ul {
    padding-left: 24px;
  }

  d-toc a {
    border-bottom: none;
    text-decoration: none;
  }

  </style>
  <nav role="navigation" class="table-of-contents"></nav>
  <h2>Table of contents</h2>
  <ul>`;

  for (const el of headings) {
    // should element be included in TOC?
    const isInTitle = el.parentElement.tagName == 'D-TITLE';
    const isException = el.getAttribute('no-toc');
    if (isInTitle || isException) { continue; }
    // create TOC entry
    const title = el.textContent;
    const link = '#' + el.getAttribute('id');

    let newLine = '<li>' + '<a href="' + link + '">' + title + '</a>' + '</li>';
    if (el.tagName == 'H3') {
      newLine = '<ul>' + newLine + '</ul>';
    } else {
      newLine += '<br>';
    }
    ToC += newLine;

  }

  ToC += '</ul></nav>';
  element.innerHTML = ToC;
}

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Figure
//
// d-figure provides a state-machine of visibility events:
//
//                         scroll out of view
//                         +----------------+
//   *do work here*        |                |
// +----------------+    +-+---------+    +-v---------+
// | ready          +----> onscreen  |    | offscreen |
// +----------------+    +---------^-+    +---------+-+
//                                 |                |
//                                 +----------------+
//                                  scroll into view
//

class Figure extends HTMLElement {

  static get is() { return 'd-figure'; }

  static get readyQueue() {
    if (!Figure._readyQueue) {
      Figure._readyQueue = [];
    }
    return Figure._readyQueue;
  }

  static addToReadyQueue(figure) {
    if (Figure.readyQueue.indexOf(figure) === -1) {
      Figure.readyQueue.push(figure);
      Figure.runReadyQueue();
    }
  }

  static runReadyQueue() {
    // console.log("Checking to run readyQueue, length: " + Figure.readyQueue.length + ", scrolling: " + Figure.isScrolling);
    // if (Figure.isScrolling) return;
    // console.log("Running ready Queue");
    const figure = Figure.readyQueue
      .sort((a,b) => a._seenOnScreen - b._seenOnScreen )
      .filter((figure) => !figure._ready)
      .pop();
    if (figure) {
      figure.ready();
      requestAnimationFrame(Figure.runReadyQueue);
    }

  }

  constructor() {
    super();
    // debugger
    this._ready = false;
    this._onscreen = false;
    this._offscreen = true;
  }

  connectedCallback() {
    this.loadsWhileScrolling = this.hasAttribute('loadsWhileScrolling');
    Figure.marginObserver.observe(this);
    Figure.directObserver.observe(this);
  }

  disconnectedCallback() {
    Figure.marginObserver.unobserve(this);
    Figure.directObserver.unobserve(this);
  }

  // We use two separate observers:
  // One with an extra 1000px margin to warn if the viewpoint gets close,
  // And one for the actual on/off screen events

  static get marginObserver() {
    if (!Figure._marginObserver) {
      // if (!('IntersectionObserver' in window)) {
      //   throw new Error('no interscetionobbserver!');
      // }
      const viewportHeight = window.innerHeight;
      const margin = Math.floor(2 * viewportHeight);
      const options = {rootMargin: margin + 'px 0px ' + margin + 'px 0px', threshold: 0.01};
      const callback = Figure.didObserveMarginIntersection;
      const observer = new IntersectionObserver(callback, options);
      Figure._marginObserver = observer;
    }
    return Figure._marginObserver;
  }

  static didObserveMarginIntersection(entries) {
    for (const entry of entries) {
      const figure = entry.target;
      if (entry.isIntersecting && !figure._ready) {
        Figure.addToReadyQueue(figure);
      }
    }
  }

  static get directObserver() {
    if (!Figure._directObserver) {
      Figure._directObserver = new IntersectionObserver(
        Figure.didObserveDirectIntersection, {
          rootMargin: '0px', threshold: [0, 1.0],
        }
      );
    }
    return Figure._directObserver;
  }

  static didObserveDirectIntersection(entries) {
    for (const entry of entries) {
      const figure = entry.target;
      if (entry.isIntersecting) {
        figure._seenOnScreen = new Date();
        // if (!figure._ready) { figure.ready(); }
        if (figure._offscreen) { figure.onscreen(); }
      } else {
        if (figure._onscreen) { figure.offscreen(); }
      }
    }
  }

  // Notify listeners that registered late, too:

  addEventListener(eventName, callback) {
    super.addEventListener(eventName, callback);
    // if we had already dispatched something while presumingly no one was listening, we do so again
    // debugger
    if (eventName === 'ready') {
      if (Figure.readyQueue.indexOf(this) !== -1) {
        this._ready = false;
        Figure.runReadyQueue();
      }
    }
    if (eventName === 'onscreen') {
      this.onscreen();
    }
  }

  // Custom Events

  ready() {
    // debugger
    this._ready = true;
    Figure.marginObserver.unobserve(this);
    const event = new CustomEvent('ready');
    this.dispatchEvent(event);
  }

  onscreen() {
    this._onscreen = true;
    this._offscreen = false;
    const event = new CustomEvent('onscreen');
    this.dispatchEvent(event);
  }

  offscreen() {
    this._onscreen = false;
    this._offscreen = true;
    const event = new CustomEvent('offscreen');
    this.dispatchEvent(event);
  }

}

if (typeof window !== 'undefined') {

  Figure.isScrolling = false;
  let timeout;
  const resetTimer = () => {
    Figure.isScrolling = true;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      Figure.isScrolling = false;
      Figure.runReadyQueue();
    }, 500);
  };
  window.addEventListener('scroll', resetTimer, true);

}

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// This overlay is not secure.
// It is only meant as a social deterrent.

const productionHostname = 'distill.pub';
const T$9 = Template('d-interstitial', `
<style>

.overlay {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background: white;

  opacity: 1;
  visibility: visible;

  display: flex;
  flex-flow: column;
  justify-content: center;
  z-index: 2147483647 /* MaxInt32 */

}

.container {
  position: relative;
  margin-left: auto;
  margin-right: auto;
  max-width: 420px;
  padding: 2em;
}

h1 {
  text-decoration: underline;
  text-decoration-color: hsl(0,100%,40%);
  -webkit-text-decoration-color: hsl(0,100%,40%);
  margin-bottom: 1em;
  line-height: 1.5em;
}

input[type="password"] {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  -webkit-box-shadow: none;
  -moz-box-shadow: none;
  box-shadow: none;
  -webkit-border-radius: none;
  -moz-border-radius: none;
  -ms-border-radius: none;
  -o-border-radius: none;
  border-radius: none;
  outline: none;

  font-size: 18px;
  background: none;
  width: 25%;
  padding: 10px;
  border: none;
  border-bottom: solid 2px #999;
  transition: border .3s;
}

input[type="password"]:focus {
  border-bottom: solid 2px #333;
}

input[type="password"].wrong {
  border-bottom: solid 2px hsl(0,100%,40%);
}

p small {
  color: #888;
}

.logo {
  position: relative;
  font-size: 1.5em;
  margin-bottom: 3em;
}

.logo svg {
  width: 36px;
  position: relative;
  top: 6px;
  margin-right: 2px;
}

.logo svg path {
  fill: none;
  stroke: black;
  stroke-width: 2px;
}

</style>

<div class="overlay">
  <div class="container">
    <h1>This article is in review.</h1>
    <p>Do not share this URL or the contents of this article. Thank you!</p>
    <input id="interstitial-password-input" type="password" name="password" autofocus/>
    <p><small>Enter the password we shared with you as part of the review process to view the article.</small></p>
  </div>
</div>
`);

class Interstitial extends T$9(HTMLElement) {

  connectedCallback() {
    if (this.shouldRemoveSelf()) {
      this.parentElement.removeChild(this);
    } else {
      const passwordInput = this.root.querySelector('#interstitial-password-input');
      passwordInput.oninput = (event) => this.passwordChanged(event);
    }
  }

  passwordChanged(event) {
    const entered = event.target.value;
    if (entered === this.password) {
      console.log('Correct password entered.');
      this.parentElement.removeChild(this);
      if (typeof(Storage) !== 'undefined') {
        console.log('Saved that correct password was entered.');
        localStorage.setItem(this.localStorageIdentifier(), 'true');
      }
    }
  }

  shouldRemoveSelf() {
    // should never be visible in production
    if (window && window.location.hostname === productionHostname) {
      console.warn('Interstitial found on production, hiding it.');
      return true
    }
    // should only have to enter password once
    if (typeof(Storage) !== 'undefined') {
      if (localStorage.getItem(this.localStorageIdentifier()) === 'true') {
        console.log('Loaded that correct password was entered before; skipping interstitial.');
        return true;
      }
    }
    // otherwise, leave visible
    return false;
  }

  localStorageIdentifier() {
    const prefix = 'distill-drafts';
    const suffix = 'interstitial-password-correct';
    return prefix + (window ? window.location.pathname : '-') + suffix
  }

}

var ascending = function(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
};

var bisector = function(compare) {
  if (compare.length === 1) { compare = ascendingComparator(compare); }
  return {
    left: function(a, x, lo, hi) {
      if (lo == null) { lo = 0; }
      if (hi == null) { hi = a.length; }
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) < 0) { lo = mid + 1; }
        else { hi = mid; }
      }
      return lo;
    },
    right: function(a, x, lo, hi) {
      if (lo == null) { lo = 0; }
      if (hi == null) { hi = a.length; }
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) > 0) { hi = mid; }
        else { lo = mid + 1; }
      }
      return lo;
    }
  };
};

function ascendingComparator(f) {
  return function(d, x) {
    return ascending(f(d), x);
  };
}

var ascendingBisect = bisector(ascending);
var bisectRight = ascendingBisect.right;

var range = function(start, stop, step) {
  start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;

  var i = -1,
      n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
      range = new Array(n);

  while (++i < n) {
    range[i] = start + i * step;
  }

  return range;
};

var e10 = Math.sqrt(50);
var e5 = Math.sqrt(10);
var e2 = Math.sqrt(2);

var ticks = function(start, stop, count) {
  var reverse,
      i = -1,
      n,
      ticks,
      step;

  stop = +stop, start = +start, count = +count;
  if (start === stop && count > 0) { return [start]; }
  if (reverse = stop < start) { n = start, start = stop, stop = n; }
  if ((step = tickIncrement(start, stop, count)) === 0 || !isFinite(step)) { return []; }

  if (step > 0) {
    start = Math.ceil(start / step);
    stop = Math.floor(stop / step);
    ticks = new Array(n = Math.ceil(stop - start + 1));
    while (++i < n) { ticks[i] = (start + i) * step; }
  } else {
    start = Math.floor(start * step);
    stop = Math.ceil(stop * step);
    ticks = new Array(n = Math.ceil(start - stop + 1));
    while (++i < n) { ticks[i] = (start - i) / step; }
  }

  if (reverse) { ticks.reverse(); }

  return ticks;
};

function tickIncrement(start, stop, count) {
  var step = (stop - start) / Math.max(0, count),
      power = Math.floor(Math.log(step) / Math.LN10),
      error = step / Math.pow(10, power);
  return power >= 0
      ? (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1) * Math.pow(10, power)
      : -Math.pow(10, -power) / (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1);
}

function tickStep(start, stop, count) {
  var step0 = Math.abs(stop - start) / Math.max(0, count),
      step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
      error = step0 / step1;
  if (error >= e10) { step1 *= 10; }
  else if (error >= e5) { step1 *= 5; }
  else if (error >= e2) { step1 *= 2; }
  return stop < start ? -step1 : step1;
}

var array$1 = Array.prototype;

var map$3 = array$1.map;
var slice$1 = array$1.slice;

var define = function(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
};

function extend(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition) { prototype[key] = definition[key]; }
  return prototype;
}

function Color() {}

var darker = 0.7;
var brighter = 1 / darker;

var reI = "\\s*([+-]?\\d+)\\s*";
var reN = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*";
var reP = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
var reHex3 = /^#([0-9a-f]{3})$/;
var reHex6 = /^#([0-9a-f]{6})$/;
var reRgbInteger = new RegExp("^rgb\\(" + [reI, reI, reI] + "\\)$");
var reRgbPercent = new RegExp("^rgb\\(" + [reP, reP, reP] + "\\)$");
var reRgbaInteger = new RegExp("^rgba\\(" + [reI, reI, reI, reN] + "\\)$");
var reRgbaPercent = new RegExp("^rgba\\(" + [reP, reP, reP, reN] + "\\)$");
var reHslPercent = new RegExp("^hsl\\(" + [reN, reP, reP] + "\\)$");
var reHslaPercent = new RegExp("^hsla\\(" + [reN, reP, reP, reN] + "\\)$");

var named = {
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkgrey: 0xa9a9a9,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  grey: 0x808080,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  rebeccapurple: 0x663399,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32
};

define(Color, color, {
  displayable: function() {
    return this.rgb().displayable();
  },
  toString: function() {
    return this.rgb() + "";
  }
});

function color(format) {
  var m;
  format = (format + "").trim().toLowerCase();
  return (m = reHex3.exec(format)) ? (m = parseInt(m[1], 16), new Rgb((m >> 8 & 0xf) | (m >> 4 & 0x0f0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1)) // #f00
      : (m = reHex6.exec(format)) ? rgbn(parseInt(m[1], 16)) // #ff0000
      : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
      : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
      : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
      : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
      : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
      : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
      : named.hasOwnProperty(format) ? rgbn(named[format])
      : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
      : null;
}

function rgbn(n) {
  return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
}

function rgba(r, g, b, a) {
  if (a <= 0) { r = g = b = NaN; }
  return new Rgb(r, g, b, a);
}

function rgbConvert(o) {
  if (!(o instanceof Color)) { o = color(o); }
  if (!o) { return new Rgb; }
  o = o.rgb();
  return new Rgb(o.r, o.g, o.b, o.opacity);
}

function rgb(r, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
}

function Rgb(r, g, b, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}

define(Rgb, rgb, extend(Color, {
  brighter: function(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker: function(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb: function() {
    return this;
  },
  displayable: function() {
    return (0 <= this.r && this.r <= 255)
        && (0 <= this.g && this.g <= 255)
        && (0 <= this.b && this.b <= 255)
        && (0 <= this.opacity && this.opacity <= 1);
  },
  toString: function() {
    var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
    return (a === 1 ? "rgb(" : "rgba(")
        + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", "
        + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", "
        + Math.max(0, Math.min(255, Math.round(this.b) || 0))
        + (a === 1 ? ")" : ", " + a + ")");
  }
}));

function hsla(h, s, l, a) {
  if (a <= 0) { h = s = l = NaN; }
  else if (l <= 0 || l >= 1) { h = s = NaN; }
  else if (s <= 0) { h = NaN; }
  return new Hsl(h, s, l, a);
}

function hslConvert(o) {
  if (o instanceof Hsl) { return new Hsl(o.h, o.s, o.l, o.opacity); }
  if (!(o instanceof Color)) { o = color(o); }
  if (!o) { return new Hsl; }
  if (o instanceof Hsl) { return o; }
  o = o.rgb();
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      h = NaN,
      s = max - min,
      l = (max + min) / 2;
  if (s) {
    if (r === max) { h = (g - b) / s + (g < b) * 6; }
    else if (g === max) { h = (b - r) / s + 2; }
    else { h = (r - g) / s + 4; }
    s /= l < 0.5 ? max + min : 2 - max - min;
    h *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl(h, s, l, o.opacity);
}

function hsl(h, s, l, opacity) {
  return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
}

function Hsl(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define(Hsl, hsl, extend(Color, {
  brighter: function(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function() {
    var h = this.h % 360 + (this.h < 0) * 360,
        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
        l = this.l,
        m2 = l + (l < 0.5 ? l : 1 - l) * s,
        m1 = 2 * l - m2;
    return new Rgb(
      hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
      hsl2rgb(h, m1, m2),
      hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
      this.opacity
    );
  },
  displayable: function() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s))
        && (0 <= this.l && this.l <= 1)
        && (0 <= this.opacity && this.opacity <= 1);
  }
}));

/* From FvD 13.37, CSS Color Module Level 3 */
function hsl2rgb(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60
      : h < 180 ? m2
      : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
      : m1) * 255;
}

var deg2rad = Math.PI / 180;
var rad2deg = 180 / Math.PI;

var Kn = 18;
var Xn = 0.950470;
var Yn = 1;
var Zn = 1.088830;
var t0 = 4 / 29;
var t1 = 6 / 29;
var t2 = 3 * t1 * t1;
var t3 = t1 * t1 * t1;

function labConvert(o) {
  if (o instanceof Lab) { return new Lab(o.l, o.a, o.b, o.opacity); }
  if (o instanceof Hcl) {
    var h = o.h * deg2rad;
    return new Lab(o.l, Math.cos(h) * o.c, Math.sin(h) * o.c, o.opacity);
  }
  if (!(o instanceof Rgb)) { o = rgbConvert(o); }
  var b = rgb2xyz(o.r),
      a = rgb2xyz(o.g),
      l = rgb2xyz(o.b),
      x = xyz2lab((0.4124564 * b + 0.3575761 * a + 0.1804375 * l) / Xn),
      y = xyz2lab((0.2126729 * b + 0.7151522 * a + 0.0721750 * l) / Yn),
      z = xyz2lab((0.0193339 * b + 0.1191920 * a + 0.9503041 * l) / Zn);
  return new Lab(116 * y - 16, 500 * (x - y), 200 * (y - z), o.opacity);
}

function lab(l, a, b, opacity) {
  return arguments.length === 1 ? labConvert(l) : new Lab(l, a, b, opacity == null ? 1 : opacity);
}

function Lab(l, a, b, opacity) {
  this.l = +l;
  this.a = +a;
  this.b = +b;
  this.opacity = +opacity;
}

define(Lab, lab, extend(Color, {
  brighter: function(k) {
    return new Lab(this.l + Kn * (k == null ? 1 : k), this.a, this.b, this.opacity);
  },
  darker: function(k) {
    return new Lab(this.l - Kn * (k == null ? 1 : k), this.a, this.b, this.opacity);
  },
  rgb: function() {
    var y = (this.l + 16) / 116,
        x = isNaN(this.a) ? y : y + this.a / 500,
        z = isNaN(this.b) ? y : y - this.b / 200;
    y = Yn * lab2xyz(y);
    x = Xn * lab2xyz(x);
    z = Zn * lab2xyz(z);
    return new Rgb(
      xyz2rgb( 3.2404542 * x - 1.5371385 * y - 0.4985314 * z), // D65 -> sRGB
      xyz2rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z),
      xyz2rgb( 0.0556434 * x - 0.2040259 * y + 1.0572252 * z),
      this.opacity
    );
  }
}));

function xyz2lab(t) {
  return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0;
}

function lab2xyz(t) {
  return t > t1 ? t * t * t : t2 * (t - t0);
}

function xyz2rgb(x) {
  return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
}

function rgb2xyz(x) {
  return (x /= 255) <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

function hclConvert(o) {
  if (o instanceof Hcl) { return new Hcl(o.h, o.c, o.l, o.opacity); }
  if (!(o instanceof Lab)) { o = labConvert(o); }
  var h = Math.atan2(o.b, o.a) * rad2deg;
  return new Hcl(h < 0 ? h + 360 : h, Math.sqrt(o.a * o.a + o.b * o.b), o.l, o.opacity);
}

function hcl(h, c, l, opacity) {
  return arguments.length === 1 ? hclConvert(h) : new Hcl(h, c, l, opacity == null ? 1 : opacity);
}

function Hcl(h, c, l, opacity) {
  this.h = +h;
  this.c = +c;
  this.l = +l;
  this.opacity = +opacity;
}

define(Hcl, hcl, extend(Color, {
  brighter: function(k) {
    return new Hcl(this.h, this.c, this.l + Kn * (k == null ? 1 : k), this.opacity);
  },
  darker: function(k) {
    return new Hcl(this.h, this.c, this.l - Kn * (k == null ? 1 : k), this.opacity);
  },
  rgb: function() {
    return labConvert(this).rgb();
  }
}));

var A = -0.14861;
var B = +1.78277;
var C = -0.29227;
var D = -0.90649;
var E = +1.97294;
var ED = E * D;
var EB = E * B;
var BC_DA = B * C - D * A;

function cubehelixConvert(o) {
  if (o instanceof Cubehelix) { return new Cubehelix(o.h, o.s, o.l, o.opacity); }
  if (!(o instanceof Rgb)) { o = rgbConvert(o); }
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      l = (BC_DA * b + ED * r - EB * g) / (BC_DA + ED - EB),
      bl = b - l,
      k = (E * (g - l) - C * bl) / D,
      s = Math.sqrt(k * k + bl * bl) / (E * l * (1 - l)), // NaN if l=0 or l=1
      h = s ? Math.atan2(k, bl) * rad2deg - 120 : NaN;
  return new Cubehelix(h < 0 ? h + 360 : h, s, l, o.opacity);
}

function cubehelix(h, s, l, opacity) {
  return arguments.length === 1 ? cubehelixConvert(h) : new Cubehelix(h, s, l, opacity == null ? 1 : opacity);
}

function Cubehelix(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define(Cubehelix, cubehelix, extend(Color, {
  brighter: function(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function() {
    var h = isNaN(this.h) ? 0 : (this.h + 120) * deg2rad,
        l = +this.l,
        a = isNaN(this.s) ? 0 : this.s * l * (1 - l),
        cosh = Math.cos(h),
        sinh = Math.sin(h);
    return new Rgb(
      255 * (l + a * (A * cosh + B * sinh)),
      255 * (l + a * (C * cosh + D * sinh)),
      255 * (l + a * (E * cosh)),
      this.opacity
    );
  }
}));

var constant$1 = function(x) {
  return function() {
    return x;
  };
};

function linear$1(a, d) {
  return function(t) {
    return a + t * d;
  };
}

function exponential(a, b, y) {
  return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
    return Math.pow(a + t * b, y);
  };
}

function hue(a, b) {
  var d = b - a;
  return d ? linear$1(a, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d) : constant$1(isNaN(a) ? b : a);
}

function gamma(y) {
  return (y = +y) === 1 ? nogamma : function(a, b) {
    return b - a ? exponential(a, b, y) : constant$1(isNaN(a) ? b : a);
  };
}

function nogamma(a, b) {
  var d = b - a;
  return d ? linear$1(a, d) : constant$1(isNaN(a) ? b : a);
}

var rgb$1 = (function rgbGamma(y) {
  var color$$1 = gamma(y);

  function rgb$$1(start, end) {
    var r = color$$1((start = rgb(start)).r, (end = rgb(end)).r),
        g = color$$1(start.g, end.g),
        b = color$$1(start.b, end.b),
        opacity = nogamma(start.opacity, end.opacity);
    return function(t) {
      start.r = r(t);
      start.g = g(t);
      start.b = b(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }

  rgb$$1.gamma = rgbGamma;

  return rgb$$1;
})(1);

var array$2 = function(a, b) {
  var nb = b ? b.length : 0,
      na = a ? Math.min(nb, a.length) : 0,
      x = new Array(nb),
      c = new Array(nb),
      i;

  for (i = 0; i < na; ++i) { x[i] = interpolateValue(a[i], b[i]); }
  for (; i < nb; ++i) { c[i] = b[i]; }

  return function(t) {
    for (i = 0; i < na; ++i) { c[i] = x[i](t); }
    return c;
  };
};

var date = function(a, b) {
  var d = new Date;
  return a = +a, b -= a, function(t) {
    return d.setTime(a + b * t), d;
  };
};

var reinterpolate = function(a, b) {
  return a = +a, b -= a, function(t) {
    return a + b * t;
  };
};

var object = function(a, b) {
  var i = {},
      c = {},
      k;

  if (a === null || typeof a !== "object") { a = {}; }
  if (b === null || typeof b !== "object") { b = {}; }

  for (k in b) {
    if (k in a) {
      i[k] = interpolateValue(a[k], b[k]);
    } else {
      c[k] = b[k];
    }
  }

  return function(t) {
    for (k in i) { c[k] = i[k](t); }
    return c;
  };
};

var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
var reB = new RegExp(reA.source, "g");

function zero(b) {
  return function() {
    return b;
  };
}

function one(b) {
  return function(t) {
    return b(t) + "";
  };
}

var string = function(a, b) {
  var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
      am, // current match in a
      bm, // current match in b
      bs, // string preceding current number in b, if any
      i = -1, // index in s
      s = [], // string constants and placeholders
      q = []; // number interpolators

  // Coerce inputs to strings.
  a = a + "", b = b + "";

  // Interpolate pairs of numbers in a & b.
  while ((am = reA.exec(a))
      && (bm = reB.exec(b))) {
    if ((bs = bm.index) > bi) { // a string precedes the next number in b
      bs = b.slice(bi, bs);
      if (s[i]) { s[i] += bs; } // coalesce with previous string
      else { s[++i] = bs; }
    }
    if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
      if (s[i]) { s[i] += bm; } // coalesce with previous string
      else { s[++i] = bm; }
    } else { // interpolate non-matching numbers
      s[++i] = null;
      q.push({i: i, x: reinterpolate(am, bm)});
    }
    bi = reB.lastIndex;
  }

  // Add remains of b.
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i]) { s[i] += bs; } // coalesce with previous string
    else { s[++i] = bs; }
  }

  // Special optimization for only a single match.
  // Otherwise, interpolate each of the numbers and rejoin the string.
  return s.length < 2 ? (q[0]
      ? one(q[0].x)
      : zero(b))
      : (b = q.length, function(t) {
          for (var i = 0, o; i < b; ++i) { s[(o = q[i]).i] = o.x(t); }
          return s.join("");
        });
};

var interpolateValue = function(a, b) {
  var t = typeof b, c;
  return b == null || t === "boolean" ? constant$1(b)
      : (t === "number" ? reinterpolate
      : t === "string" ? ((c = color(b)) ? (b = c, rgb$1) : string)
      : b instanceof color ? rgb$1
      : b instanceof Date ? date
      : Array.isArray(b) ? array$2
      : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object
      : reinterpolate)(a, b);
};

var interpolateRound = function(a, b) {
  return a = +a, b -= a, function(t) {
    return Math.round(a + b * t);
  };
};

function cubehelix$1(hue$$1) {
  return (function cubehelixGamma(y) {
    y = +y;

    function cubehelix$$1(start, end) {
      var h = hue$$1((start = cubehelix(start)).h, (end = cubehelix(end)).h),
          s = nogamma(start.s, end.s),
          l = nogamma(start.l, end.l),
          opacity = nogamma(start.opacity, end.opacity);
      return function(t) {
        start.h = h(t);
        start.s = s(t);
        start.l = l(Math.pow(t, y));
        start.opacity = opacity(t);
        return start + "";
      };
    }

    cubehelix$$1.gamma = cubehelixGamma;

    return cubehelix$$1;
  })(1);
}

cubehelix$1(hue);
var cubehelixLong = cubehelix$1(nogamma);

var constant$2 = function(x) {
  return function() {
    return x;
  };
};

var number$1 = function(x) {
  return +x;
};

var unit = [0, 1];

function deinterpolateLinear(a, b) {
  return (b -= (a = +a))
      ? function(x) { return (x - a) / b; }
      : constant$2(b);
}

function deinterpolateClamp(deinterpolate) {
  return function(a, b) {
    var d = deinterpolate(a = +a, b = +b);
    return function(x) { return x <= a ? 0 : x >= b ? 1 : d(x); };
  };
}

function reinterpolateClamp(reinterpolate) {
  return function(a, b) {
    var r = reinterpolate(a = +a, b = +b);
    return function(t) { return t <= 0 ? a : t >= 1 ? b : r(t); };
  };
}

function bimap(domain, range, deinterpolate, reinterpolate) {
  var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
  if (d1 < d0) { d0 = deinterpolate(d1, d0), r0 = reinterpolate(r1, r0); }
  else { d0 = deinterpolate(d0, d1), r0 = reinterpolate(r0, r1); }
  return function(x) { return r0(d0(x)); };
}

function polymap(domain, range, deinterpolate, reinterpolate) {
  var j = Math.min(domain.length, range.length) - 1,
      d = new Array(j),
      r = new Array(j),
      i = -1;

  // Reverse descending domains.
  if (domain[j] < domain[0]) {
    domain = domain.slice().reverse();
    range = range.slice().reverse();
  }

  while (++i < j) {
    d[i] = deinterpolate(domain[i], domain[i + 1]);
    r[i] = reinterpolate(range[i], range[i + 1]);
  }

  return function(x) {
    var i = bisectRight(domain, x, 1, j) - 1;
    return r[i](d[i](x));
  };
}

function copy(source, target) {
  return target
      .domain(source.domain())
      .range(source.range())
      .interpolate(source.interpolate())
      .clamp(source.clamp());
}

// deinterpolate(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
// reinterpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding domain value x in [a,b].
function continuous(deinterpolate, reinterpolate) {
  var domain = unit,
      range = unit,
      interpolate$$1 = interpolateValue,
      clamp = false,
      piecewise,
      output,
      input;

  function rescale() {
    piecewise = Math.min(domain.length, range.length) > 2 ? polymap : bimap;
    output = input = null;
    return scale;
  }

  function scale(x) {
    return (output || (output = piecewise(domain, range, clamp ? deinterpolateClamp(deinterpolate) : deinterpolate, interpolate$$1)))(+x);
  }

  scale.invert = function(y) {
    return (input || (input = piecewise(range, domain, deinterpolateLinear, clamp ? reinterpolateClamp(reinterpolate) : reinterpolate)))(+y);
  };

  scale.domain = function(_) {
    return arguments.length ? (domain = map$3.call(_, number$1), rescale()) : domain.slice();
  };

  scale.range = function(_) {
    return arguments.length ? (range = slice$1.call(_), rescale()) : range.slice();
  };

  scale.rangeRound = function(_) {
    return range = slice$1.call(_), interpolate$$1 = interpolateRound, rescale();
  };

  scale.clamp = function(_) {
    return arguments.length ? (clamp = !!_, rescale()) : clamp;
  };

  scale.interpolate = function(_) {
    return arguments.length ? (interpolate$$1 = _, rescale()) : interpolate$$1;
  };

  return rescale();
}

// Computes the decimal coefficient and exponent of the specified number x with
// significant digits p, where x is positive and p is in [1, 21] or undefined.
// For example, formatDecimal(1.23) returns ["123", 0].
var formatDecimal = function(x, p) {
  if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) { return null; } // NaN, ±Infinity
  var i, coefficient = x.slice(0, i);

  // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
  // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
  return [
    coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
    +x.slice(i + 1)
  ];
};

var exponent = function(x) {
  return x = formatDecimal(Math.abs(x)), x ? x[1] : NaN;
};

var formatGroup = function(grouping, thousands) {
  return function(value, width) {
    var i = value.length,
        t = [],
        j = 0,
        g = grouping[0],
        length = 0;

    while (i > 0 && g > 0) {
      if (length + g + 1 > width) { g = Math.max(1, width - length); }
      t.push(value.substring(i -= g, i + g));
      if ((length += g + 1) > width) { break; }
      g = grouping[j = (j + 1) % grouping.length];
    }

    return t.reverse().join(thousands);
  };
};

var formatNumerals = function(numerals) {
  return function(value) {
    return value.replace(/[0-9]/g, function(i) {
      return numerals[+i];
    });
  };
};

var formatDefault = function(x, p) {
  x = x.toPrecision(p);

  out: for (var n = x.length, i = 1, i0 = -1, i1; i < n; ++i) {
    switch (x[i]) {
      case ".": i0 = i1 = i; break;
      case "0": if (i0 === 0) { i0 = i; } i1 = i; break;
      case "e": break out;
      default: if (i0 > 0) { i0 = 0; } break;
    }
  }

  return i0 > 0 ? x.slice(0, i0) + x.slice(i1 + 1) : x;
};

var prefixExponent;

var formatPrefixAuto = function(x, p) {
  var d = formatDecimal(x, p);
  if (!d) { return x + ""; }
  var coefficient = d[0],
      exponent = d[1],
      i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
      n = coefficient.length;
  return i === n ? coefficient
      : i > n ? coefficient + new Array(i - n + 1).join("0")
      : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
      : "0." + new Array(1 - i).join("0") + formatDecimal(x, Math.max(0, p + i - 1))[0]; // less than 1y!
};

var formatRounded = function(x, p) {
  var d = formatDecimal(x, p);
  if (!d) { return x + ""; }
  var coefficient = d[0],
      exponent = d[1];
  return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
      : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
      : coefficient + new Array(exponent - coefficient.length + 2).join("0");
};

var formatTypes = {
  "": formatDefault,
  "%": function(x, p) { return (x * 100).toFixed(p); },
  "b": function(x) { return Math.round(x).toString(2); },
  "c": function(x) { return x + ""; },
  "d": function(x) { return Math.round(x).toString(10); },
  "e": function(x, p) { return x.toExponential(p); },
  "f": function(x, p) { return x.toFixed(p); },
  "g": function(x, p) { return x.toPrecision(p); },
  "o": function(x) { return Math.round(x).toString(8); },
  "p": function(x, p) { return formatRounded(x * 100, p); },
  "r": formatRounded,
  "s": formatPrefixAuto,
  "X": function(x) { return Math.round(x).toString(16).toUpperCase(); },
  "x": function(x) { return Math.round(x).toString(16); }
};

// [[fill]align][sign][symbol][0][width][,][.precision][type]
var re = /^(?:(.)?([<>=^]))?([+\-\( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?([a-z%])?$/i;

function formatSpecifier(specifier) {
  return new FormatSpecifier(specifier);
}

formatSpecifier.prototype = FormatSpecifier.prototype; // instanceof

function FormatSpecifier(specifier) {
  if (!(match = re.exec(specifier))) { throw new Error("invalid format: " + specifier); }

  var match,
      fill = match[1] || " ",
      align = match[2] || ">",
      sign = match[3] || "-",
      symbol = match[4] || "",
      zero = !!match[5],
      width = match[6] && +match[6],
      comma = !!match[7],
      precision = match[8] && +match[8].slice(1),
      type = match[9] || "";

  // The "n" type is an alias for ",g".
  if (type === "n") { comma = true, type = "g"; }

  // Map invalid types to the default format.
  else if (!formatTypes[type]) { type = ""; }

  // If zero fill is specified, padding goes after sign and before digits.
  if (zero || (fill === "0" && align === "=")) { zero = true, fill = "0", align = "="; }

  this.fill = fill;
  this.align = align;
  this.sign = sign;
  this.symbol = symbol;
  this.zero = zero;
  this.width = width;
  this.comma = comma;
  this.precision = precision;
  this.type = type;
}

FormatSpecifier.prototype.toString = function() {
  return this.fill
      + this.align
      + this.sign
      + this.symbol
      + (this.zero ? "0" : "")
      + (this.width == null ? "" : Math.max(1, this.width | 0))
      + (this.comma ? "," : "")
      + (this.precision == null ? "" : "." + Math.max(0, this.precision | 0))
      + this.type;
};

var identity$3 = function(x) {
  return x;
};

var prefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];

var formatLocale = function(locale) {
  var group = locale.grouping && locale.thousands ? formatGroup(locale.grouping, locale.thousands) : identity$3,
      currency = locale.currency,
      decimal = locale.decimal,
      numerals = locale.numerals ? formatNumerals(locale.numerals) : identity$3,
      percent = locale.percent || "%";

  function newFormat(specifier) {
    specifier = formatSpecifier(specifier);

    var fill = specifier.fill,
        align = specifier.align,
        sign = specifier.sign,
        symbol = specifier.symbol,
        zero = specifier.zero,
        width = specifier.width,
        comma = specifier.comma,
        precision = specifier.precision,
        type = specifier.type;

    // Compute the prefix and suffix.
    // For SI-prefix, the suffix is lazily computed.
    var prefix = symbol === "$" ? currency[0] : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
        suffix = symbol === "$" ? currency[1] : /[%p]/.test(type) ? percent : "";

    // What format function should we use?
    // Is this an integer type?
    // Can this type generate exponential notation?
    var formatType = formatTypes[type],
        maybeSuffix = !type || /[defgprs%]/.test(type);

    // Set the default precision if not specified,
    // or clamp the specified precision to the supported range.
    // For significant precision, it must be in [1, 21].
    // For fixed precision, it must be in [0, 20].
    precision = precision == null ? (type ? 6 : 12)
        : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
        : Math.max(0, Math.min(20, precision));

    function format(value) {
      var valuePrefix = prefix,
          valueSuffix = suffix,
          i, n, c;

      if (type === "c") {
        valueSuffix = formatType(value) + valueSuffix;
        value = "";
      } else {
        value = +value;

        // Perform the initial formatting.
        var valueNegative = value < 0;
        value = formatType(Math.abs(value), precision);

        // If a negative value rounds to zero during formatting, treat as positive.
        if (valueNegative && +value === 0) { valueNegative = false; }

        // Compute the prefix and suffix.
        valuePrefix = (valueNegative ? (sign === "(" ? sign : "-") : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
        valueSuffix = valueSuffix + (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + (valueNegative && sign === "(" ? ")" : "");

        // Break the formatted value into the integer “value” part that can be
        // grouped, and fractional or exponential “suffix” part that is not.
        if (maybeSuffix) {
          i = -1, n = value.length;
          while (++i < n) {
            if (c = value.charCodeAt(i), 48 > c || c > 57) {
              valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
              value = value.slice(0, i);
              break;
            }
          }
        }
      }

      // If the fill character is not "0", grouping is applied before padding.
      if (comma && !zero) { value = group(value, Infinity); }

      // Compute the padding.
      var length = valuePrefix.length + value.length + valueSuffix.length,
          padding = length < width ? new Array(width - length + 1).join(fill) : "";

      // If the fill character is "0", grouping is applied after padding.
      if (comma && zero) { value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = ""; }

      // Reconstruct the final output based on the desired alignment.
      switch (align) {
        case "<": value = valuePrefix + value + valueSuffix + padding; break;
        case "=": value = valuePrefix + padding + value + valueSuffix; break;
        case "^": value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length); break;
        default: value = padding + valuePrefix + value + valueSuffix; break;
      }

      return numerals(value);
    }

    format.toString = function() {
      return specifier + "";
    };

    return format;
  }

  function formatPrefix(specifier, value) {
    var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
        e = Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3,
        k = Math.pow(10, -e),
        prefix = prefixes[8 + e / 3];
    return function(value) {
      return f(k * value) + prefix;
    };
  }

  return {
    format: newFormat,
    formatPrefix: formatPrefix
  };
};

var locale;
var format;
var formatPrefix;

defaultLocale({
  decimal: ".",
  thousands: ",",
  grouping: [3],
  currency: ["$", ""]
});

function defaultLocale(definition) {
  locale = formatLocale(definition);
  format = locale.format;
  formatPrefix = locale.formatPrefix;
  return locale;
}

var precisionFixed = function(step) {
  return Math.max(0, -exponent(Math.abs(step)));
};

var precisionPrefix = function(step, value) {
  return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3 - exponent(Math.abs(step)));
};

var precisionRound = function(step, max) {
  step = Math.abs(step), max = Math.abs(max) - step;
  return Math.max(0, exponent(max) - exponent(step)) + 1;
};

var tickFormat = function(domain, count, specifier) {
  var start = domain[0],
      stop = domain[domain.length - 1],
      step = tickStep(start, stop, count == null ? 10 : count),
      precision;
  specifier = formatSpecifier(specifier == null ? ",f" : specifier);
  switch (specifier.type) {
    case "s": {
      var value = Math.max(Math.abs(start), Math.abs(stop));
      if (specifier.precision == null && !isNaN(precision = precisionPrefix(step, value))) { specifier.precision = precision; }
      return formatPrefix(specifier, value);
    }
    case "":
    case "e":
    case "g":
    case "p":
    case "r": {
      if (specifier.precision == null && !isNaN(precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop))))) { specifier.precision = precision - (specifier.type === "e"); }
      break;
    }
    case "f":
    case "%": {
      if (specifier.precision == null && !isNaN(precision = precisionFixed(step))) { specifier.precision = precision - (specifier.type === "%") * 2; }
      break;
    }
  }
  return format(specifier);
};

function linearish(scale) {
  var domain = scale.domain;

  scale.ticks = function(count) {
    var d = domain();
    return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
  };

  scale.tickFormat = function(count, specifier) {
    return tickFormat(domain(), count, specifier);
  };

  scale.nice = function(count) {
    if (count == null) { count = 10; }

    var d = domain(),
        i0 = 0,
        i1 = d.length - 1,
        start = d[i0],
        stop = d[i1],
        step;

    if (stop < start) {
      step = start, start = stop, stop = step;
      step = i0, i0 = i1, i1 = step;
    }

    step = tickIncrement(start, stop, count);

    if (step > 0) {
      start = Math.floor(start / step) * step;
      stop = Math.ceil(stop / step) * step;
      step = tickIncrement(start, stop, count);
    } else if (step < 0) {
      start = Math.ceil(start * step) / step;
      stop = Math.floor(stop * step) / step;
      step = tickIncrement(start, stop, count);
    }

    if (step > 0) {
      d[i0] = Math.floor(start / step) * step;
      d[i1] = Math.ceil(stop / step) * step;
      domain(d);
    } else if (step < 0) {
      d[i0] = Math.ceil(start * step) / step;
      d[i1] = Math.floor(stop * step) / step;
      domain(d);
    }

    return scale;
  };

  return scale;
}

function linear() {
  var scale = continuous(deinterpolateLinear, reinterpolate);

  scale.copy = function() {
    return copy(scale, linear());
  };

  return linearish(scale);
}

var t0$1 = new Date;
var t1$1 = new Date;

function newInterval(floori, offseti, count, field) {

  function interval(date) {
    return floori(date = new Date(+date)), date;
  }

  interval.floor = interval;

  interval.ceil = function(date) {
    return floori(date = new Date(date - 1)), offseti(date, 1), floori(date), date;
  };

  interval.round = function(date) {
    var d0 = interval(date),
        d1 = interval.ceil(date);
    return date - d0 < d1 - date ? d0 : d1;
  };

  interval.offset = function(date, step) {
    return offseti(date = new Date(+date), step == null ? 1 : Math.floor(step)), date;
  };

  interval.range = function(start, stop, step) {
    var range = [];
    start = interval.ceil(start);
    step = step == null ? 1 : Math.floor(step);
    if (!(start < stop) || !(step > 0)) { return range; } // also handles Invalid Date
    do { range.push(new Date(+start)); } while (offseti(start, step), floori(start), start < stop)
    return range;
  };

  interval.filter = function(test) {
    return newInterval(function(date) {
      if (date >= date) { while (floori(date), !test(date)) { date.setTime(date - 1); } }
    }, function(date, step) {
      if (date >= date) {
        if (step < 0) { while (++step <= 0) {
          while (offseti(date, -1), !test(date)) {} // eslint-disable-line no-empty
        } } else { while (--step >= 0) {
          while (offseti(date, +1), !test(date)) {} // eslint-disable-line no-empty
        } }
      }
    });
  };

  if (count) {
    interval.count = function(start, end) {
      t0$1.setTime(+start), t1$1.setTime(+end);
      floori(t0$1), floori(t1$1);
      return Math.floor(count(t0$1, t1$1));
    };

    interval.every = function(step) {
      step = Math.floor(step);
      return !isFinite(step) || !(step > 0) ? null
          : !(step > 1) ? interval
          : interval.filter(field
              ? function(d) { return field(d) % step === 0; }
              : function(d) { return interval.count(0, d) % step === 0; });
    };
  }

  return interval;
}

var millisecond = newInterval(function() {
  // noop
}, function(date, step) {
  date.setTime(+date + step);
}, function(start, end) {
  return end - start;
});

// An optimized implementation for this simple case.
millisecond.every = function(k) {
  k = Math.floor(k);
  if (!isFinite(k) || !(k > 0)) { return null; }
  if (!(k > 1)) { return millisecond; }
  return newInterval(function(date) {
    date.setTime(Math.floor(date / k) * k);
  }, function(date, step) {
    date.setTime(+date + step * k);
  }, function(start, end) {
    return (end - start) / k;
  });
};

var durationSecond$1 = 1e3;
var durationMinute$1 = 6e4;
var durationHour$1 = 36e5;
var durationDay$1 = 864e5;
var durationWeek$1 = 6048e5;

var second = newInterval(function(date) {
  date.setTime(Math.floor(date / durationSecond$1) * durationSecond$1);
}, function(date, step) {
  date.setTime(+date + step * durationSecond$1);
}, function(start, end) {
  return (end - start) / durationSecond$1;
}, function(date) {
  return date.getUTCSeconds();
});

var minute = newInterval(function(date) {
  date.setTime(Math.floor(date / durationMinute$1) * durationMinute$1);
}, function(date, step) {
  date.setTime(+date + step * durationMinute$1);
}, function(start, end) {
  return (end - start) / durationMinute$1;
}, function(date) {
  return date.getMinutes();
});

var hour = newInterval(function(date) {
  var offset = date.getTimezoneOffset() * durationMinute$1 % durationHour$1;
  if (offset < 0) { offset += durationHour$1; }
  date.setTime(Math.floor((+date - offset) / durationHour$1) * durationHour$1 + offset);
}, function(date, step) {
  date.setTime(+date + step * durationHour$1);
}, function(start, end) {
  return (end - start) / durationHour$1;
}, function(date) {
  return date.getHours();
});

var day = newInterval(function(date) {
  date.setHours(0, 0, 0, 0);
}, function(date, step) {
  date.setDate(date.getDate() + step);
}, function(start, end) {
  return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute$1) / durationDay$1;
}, function(date) {
  return date.getDate() - 1;
});

function weekday(i) {
  return newInterval(function(date) {
    date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
    date.setHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setDate(date.getDate() + step * 7);
  }, function(start, end) {
    return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute$1) / durationWeek$1;
  });
}

var sunday = weekday(0);
var monday = weekday(1);
var tuesday = weekday(2);
var wednesday = weekday(3);
var thursday = weekday(4);
var friday = weekday(5);
var saturday = weekday(6);

var month = newInterval(function(date) {
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
}, function(date, step) {
  date.setMonth(date.getMonth() + step);
}, function(start, end) {
  return end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12;
}, function(date) {
  return date.getMonth();
});

var year = newInterval(function(date) {
  date.setMonth(0, 1);
  date.setHours(0, 0, 0, 0);
}, function(date, step) {
  date.setFullYear(date.getFullYear() + step);
}, function(start, end) {
  return end.getFullYear() - start.getFullYear();
}, function(date) {
  return date.getFullYear();
});

// An optimized implementation for this simple case.
year.every = function(k) {
  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
    date.setFullYear(Math.floor(date.getFullYear() / k) * k);
    date.setMonth(0, 1);
    date.setHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setFullYear(date.getFullYear() + step * k);
  });
};

var utcMinute = newInterval(function(date) {
  date.setUTCSeconds(0, 0);
}, function(date, step) {
  date.setTime(+date + step * durationMinute$1);
}, function(start, end) {
  return (end - start) / durationMinute$1;
}, function(date) {
  return date.getUTCMinutes();
});

var utcHour = newInterval(function(date) {
  date.setUTCMinutes(0, 0, 0);
}, function(date, step) {
  date.setTime(+date + step * durationHour$1);
}, function(start, end) {
  return (end - start) / durationHour$1;
}, function(date) {
  return date.getUTCHours();
});

var utcDay = newInterval(function(date) {
  date.setUTCHours(0, 0, 0, 0);
}, function(date, step) {
  date.setUTCDate(date.getUTCDate() + step);
}, function(start, end) {
  return (end - start) / durationDay$1;
}, function(date) {
  return date.getUTCDate() - 1;
});

function utcWeekday(i) {
  return newInterval(function(date) {
    date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
    date.setUTCHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setUTCDate(date.getUTCDate() + step * 7);
  }, function(start, end) {
    return (end - start) / durationWeek$1;
  });
}

var utcSunday = utcWeekday(0);
var utcMonday = utcWeekday(1);
var utcTuesday = utcWeekday(2);
var utcWednesday = utcWeekday(3);
var utcThursday = utcWeekday(4);
var utcFriday = utcWeekday(5);
var utcSaturday = utcWeekday(6);

var utcMonth = newInterval(function(date) {
  date.setUTCDate(1);
  date.setUTCHours(0, 0, 0, 0);
}, function(date, step) {
  date.setUTCMonth(date.getUTCMonth() + step);
}, function(start, end) {
  return end.getUTCMonth() - start.getUTCMonth() + (end.getUTCFullYear() - start.getUTCFullYear()) * 12;
}, function(date) {
  return date.getUTCMonth();
});

var utcYear = newInterval(function(date) {
  date.setUTCMonth(0, 1);
  date.setUTCHours(0, 0, 0, 0);
}, function(date, step) {
  date.setUTCFullYear(date.getUTCFullYear() + step);
}, function(start, end) {
  return end.getUTCFullYear() - start.getUTCFullYear();
}, function(date) {
  return date.getUTCFullYear();
});

// An optimized implementation for this simple case.
utcYear.every = function(k) {
  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
    date.setUTCFullYear(Math.floor(date.getUTCFullYear() / k) * k);
    date.setUTCMonth(0, 1);
    date.setUTCHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setUTCFullYear(date.getUTCFullYear() + step * k);
  });
};

function localDate(d) {
  if (0 <= d.y && d.y < 100) {
    var date = new Date(-1, d.m, d.d, d.H, d.M, d.S, d.L);
    date.setFullYear(d.y);
    return date;
  }
  return new Date(d.y, d.m, d.d, d.H, d.M, d.S, d.L);
}

function utcDate(d) {
  if (0 <= d.y && d.y < 100) {
    var date = new Date(Date.UTC(-1, d.m, d.d, d.H, d.M, d.S, d.L));
    date.setUTCFullYear(d.y);
    return date;
  }
  return new Date(Date.UTC(d.y, d.m, d.d, d.H, d.M, d.S, d.L));
}

function newYear(y) {
  return {y: y, m: 0, d: 1, H: 0, M: 0, S: 0, L: 0};
}

function formatLocale$1(locale) {
  var locale_dateTime = locale.dateTime,
      locale_date = locale.date,
      locale_time = locale.time,
      locale_periods = locale.periods,
      locale_weekdays = locale.days,
      locale_shortWeekdays = locale.shortDays,
      locale_months = locale.months,
      locale_shortMonths = locale.shortMonths;

  var periodRe = formatRe(locale_periods),
      periodLookup = formatLookup(locale_periods),
      weekdayRe = formatRe(locale_weekdays),
      weekdayLookup = formatLookup(locale_weekdays),
      shortWeekdayRe = formatRe(locale_shortWeekdays),
      shortWeekdayLookup = formatLookup(locale_shortWeekdays),
      monthRe = formatRe(locale_months),
      monthLookup = formatLookup(locale_months),
      shortMonthRe = formatRe(locale_shortMonths),
      shortMonthLookup = formatLookup(locale_shortMonths);

  var formats = {
    "a": formatShortWeekday,
    "A": formatWeekday,
    "b": formatShortMonth,
    "B": formatMonth,
    "c": null,
    "d": formatDayOfMonth,
    "e": formatDayOfMonth,
    "H": formatHour24,
    "I": formatHour12,
    "j": formatDayOfYear,
    "L": formatMilliseconds,
    "m": formatMonthNumber,
    "M": formatMinutes,
    "p": formatPeriod,
    "S": formatSeconds,
    "U": formatWeekNumberSunday,
    "w": formatWeekdayNumber,
    "W": formatWeekNumberMonday,
    "x": null,
    "X": null,
    "y": formatYear,
    "Y": formatFullYear,
    "Z": formatZone,
    "%": formatLiteralPercent
  };

  var utcFormats = {
    "a": formatUTCShortWeekday,
    "A": formatUTCWeekday,
    "b": formatUTCShortMonth,
    "B": formatUTCMonth,
    "c": null,
    "d": formatUTCDayOfMonth,
    "e": formatUTCDayOfMonth,
    "H": formatUTCHour24,
    "I": formatUTCHour12,
    "j": formatUTCDayOfYear,
    "L": formatUTCMilliseconds,
    "m": formatUTCMonthNumber,
    "M": formatUTCMinutes,
    "p": formatUTCPeriod,
    "S": formatUTCSeconds,
    "U": formatUTCWeekNumberSunday,
    "w": formatUTCWeekdayNumber,
    "W": formatUTCWeekNumberMonday,
    "x": null,
    "X": null,
    "y": formatUTCYear,
    "Y": formatUTCFullYear,
    "Z": formatUTCZone,
    "%": formatLiteralPercent
  };

  var parses = {
    "a": parseShortWeekday,
    "A": parseWeekday,
    "b": parseShortMonth,
    "B": parseMonth,
    "c": parseLocaleDateTime,
    "d": parseDayOfMonth,
    "e": parseDayOfMonth,
    "H": parseHour24,
    "I": parseHour24,
    "j": parseDayOfYear,
    "L": parseMilliseconds,
    "m": parseMonthNumber,
    "M": parseMinutes,
    "p": parsePeriod,
    "S": parseSeconds,
    "U": parseWeekNumberSunday,
    "w": parseWeekdayNumber,
    "W": parseWeekNumberMonday,
    "x": parseLocaleDate,
    "X": parseLocaleTime,
    "y": parseYear,
    "Y": parseFullYear,
    "Z": parseZone,
    "%": parseLiteralPercent
  };

  // These recursive directive definitions must be deferred.
  formats.x = newFormat(locale_date, formats);
  formats.X = newFormat(locale_time, formats);
  formats.c = newFormat(locale_dateTime, formats);
  utcFormats.x = newFormat(locale_date, utcFormats);
  utcFormats.X = newFormat(locale_time, utcFormats);
  utcFormats.c = newFormat(locale_dateTime, utcFormats);

  function newFormat(specifier, formats) {
    return function(date) {
      var string = [],
          i = -1,
          j = 0,
          n = specifier.length,
          c,
          pad,
          format;

      if (!(date instanceof Date)) { date = new Date(+date); }

      while (++i < n) {
        if (specifier.charCodeAt(i) === 37) {
          string.push(specifier.slice(j, i));
          if ((pad = pads[c = specifier.charAt(++i)]) != null) { c = specifier.charAt(++i); }
          else { pad = c === "e" ? " " : "0"; }
          if (format = formats[c]) { c = format(date, pad); }
          string.push(c);
          j = i + 1;
        }
      }

      string.push(specifier.slice(j, i));
      return string.join("");
    };
  }

  function newParse(specifier, newDate) {
    return function(string) {
      var d = newYear(1900),
          i = parseSpecifier(d, specifier, string += "", 0);
      if (i != string.length) { return null; }

      // The am-pm flag is 0 for AM, and 1 for PM.
      if ("p" in d) { d.H = d.H % 12 + d.p * 12; }

      // Convert day-of-week and week-of-year to day-of-year.
      if ("W" in d || "U" in d) {
        if (!("w" in d)) { d.w = "W" in d ? 1 : 0; }
        var day$$1 = "Z" in d ? utcDate(newYear(d.y)).getUTCDay() : newDate(newYear(d.y)).getDay();
        d.m = 0;
        d.d = "W" in d ? (d.w + 6) % 7 + d.W * 7 - (day$$1 + 5) % 7 : d.w + d.U * 7 - (day$$1 + 6) % 7;
      }

      // If a time zone is specified, all fields are interpreted as UTC and then
      // offset according to the specified time zone.
      if ("Z" in d) {
        d.H += d.Z / 100 | 0;
        d.M += d.Z % 100;
        return utcDate(d);
      }

      // Otherwise, all fields are in local time.
      return newDate(d);
    };
  }

  function parseSpecifier(d, specifier, string, j) {
    var i = 0,
        n = specifier.length,
        m = string.length,
        c,
        parse;

    while (i < n) {
      if (j >= m) { return -1; }
      c = specifier.charCodeAt(i++);
      if (c === 37) {
        c = specifier.charAt(i++);
        parse = parses[c in pads ? specifier.charAt(i++) : c];
        if (!parse || ((j = parse(d, string, j)) < 0)) { return -1; }
      } else if (c != string.charCodeAt(j++)) {
        return -1;
      }
    }

    return j;
  }

  function parsePeriod(d, string, i) {
    var n = periodRe.exec(string.slice(i));
    return n ? (d.p = periodLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseShortWeekday(d, string, i) {
    var n = shortWeekdayRe.exec(string.slice(i));
    return n ? (d.w = shortWeekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseWeekday(d, string, i) {
    var n = weekdayRe.exec(string.slice(i));
    return n ? (d.w = weekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseShortMonth(d, string, i) {
    var n = shortMonthRe.exec(string.slice(i));
    return n ? (d.m = shortMonthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseMonth(d, string, i) {
    var n = monthRe.exec(string.slice(i));
    return n ? (d.m = monthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseLocaleDateTime(d, string, i) {
    return parseSpecifier(d, locale_dateTime, string, i);
  }

  function parseLocaleDate(d, string, i) {
    return parseSpecifier(d, locale_date, string, i);
  }

  function parseLocaleTime(d, string, i) {
    return parseSpecifier(d, locale_time, string, i);
  }

  function formatShortWeekday(d) {
    return locale_shortWeekdays[d.getDay()];
  }

  function formatWeekday(d) {
    return locale_weekdays[d.getDay()];
  }

  function formatShortMonth(d) {
    return locale_shortMonths[d.getMonth()];
  }

  function formatMonth(d) {
    return locale_months[d.getMonth()];
  }

  function formatPeriod(d) {
    return locale_periods[+(d.getHours() >= 12)];
  }

  function formatUTCShortWeekday(d) {
    return locale_shortWeekdays[d.getUTCDay()];
  }

  function formatUTCWeekday(d) {
    return locale_weekdays[d.getUTCDay()];
  }

  function formatUTCShortMonth(d) {
    return locale_shortMonths[d.getUTCMonth()];
  }

  function formatUTCMonth(d) {
    return locale_months[d.getUTCMonth()];
  }

  function formatUTCPeriod(d) {
    return locale_periods[+(d.getUTCHours() >= 12)];
  }

  return {
    format: function(specifier) {
      var f = newFormat(specifier += "", formats);
      f.toString = function() { return specifier; };
      return f;
    },
    parse: function(specifier) {
      var p = newParse(specifier += "", localDate);
      p.toString = function() { return specifier; };
      return p;
    },
    utcFormat: function(specifier) {
      var f = newFormat(specifier += "", utcFormats);
      f.toString = function() { return specifier; };
      return f;
    },
    utcParse: function(specifier) {
      var p = newParse(specifier, utcDate);
      p.toString = function() { return specifier; };
      return p;
    }
  };
}

var pads = {"-": "", "_": " ", "0": "0"};
var numberRe = /^\s*\d+/;
var percentRe = /^%/;
var requoteRe = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;

function pad(value, fill, width) {
  var sign = value < 0 ? "-" : "",
      string = (sign ? -value : value) + "",
      length = string.length;
  return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
}

function requote(s) {
  return s.replace(requoteRe, "\\$&");
}

function formatRe(names) {
  return new RegExp("^(?:" + names.map(requote).join("|") + ")", "i");
}

function formatLookup(names) {
  var map = {}, i = -1, n = names.length;
  while (++i < n) { map[names[i].toLowerCase()] = i; }
  return map;
}

function parseWeekdayNumber(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 1));
  return n ? (d.w = +n[0], i + n[0].length) : -1;
}

function parseWeekNumberSunday(d, string, i) {
  var n = numberRe.exec(string.slice(i));
  return n ? (d.U = +n[0], i + n[0].length) : -1;
}

function parseWeekNumberMonday(d, string, i) {
  var n = numberRe.exec(string.slice(i));
  return n ? (d.W = +n[0], i + n[0].length) : -1;
}

function parseFullYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 4));
  return n ? (d.y = +n[0], i + n[0].length) : -1;
}

function parseYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.y = +n[0] + (+n[0] > 68 ? 1900 : 2000), i + n[0].length) : -1;
}

function parseZone(d, string, i) {
  var n = /^(Z)|([+-]\d\d)(?:\:?(\d\d))?/.exec(string.slice(i, i + 6));
  return n ? (d.Z = n[1] ? 0 : -(n[2] + (n[3] || "00")), i + n[0].length) : -1;
}

function parseMonthNumber(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.m = n[0] - 1, i + n[0].length) : -1;
}

function parseDayOfMonth(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.d = +n[0], i + n[0].length) : -1;
}

function parseDayOfYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 3));
  return n ? (d.m = 0, d.d = +n[0], i + n[0].length) : -1;
}

function parseHour24(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.H = +n[0], i + n[0].length) : -1;
}

function parseMinutes(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.M = +n[0], i + n[0].length) : -1;
}

function parseSeconds(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.S = +n[0], i + n[0].length) : -1;
}

function parseMilliseconds(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 3));
  return n ? (d.L = +n[0], i + n[0].length) : -1;
}

function parseLiteralPercent(d, string, i) {
  var n = percentRe.exec(string.slice(i, i + 1));
  return n ? i + n[0].length : -1;
}

function formatDayOfMonth(d, p) {
  return pad(d.getDate(), p, 2);
}

function formatHour24(d, p) {
  return pad(d.getHours(), p, 2);
}

function formatHour12(d, p) {
  return pad(d.getHours() % 12 || 12, p, 2);
}

function formatDayOfYear(d, p) {
  return pad(1 + day.count(year(d), d), p, 3);
}

function formatMilliseconds(d, p) {
  return pad(d.getMilliseconds(), p, 3);
}

function formatMonthNumber(d, p) {
  return pad(d.getMonth() + 1, p, 2);
}

function formatMinutes(d, p) {
  return pad(d.getMinutes(), p, 2);
}

function formatSeconds(d, p) {
  return pad(d.getSeconds(), p, 2);
}

function formatWeekNumberSunday(d, p) {
  return pad(sunday.count(year(d), d), p, 2);
}

function formatWeekdayNumber(d) {
  return d.getDay();
}

function formatWeekNumberMonday(d, p) {
  return pad(monday.count(year(d), d), p, 2);
}

function formatYear(d, p) {
  return pad(d.getFullYear() % 100, p, 2);
}

function formatFullYear(d, p) {
  return pad(d.getFullYear() % 10000, p, 4);
}

function formatZone(d) {
  var z = d.getTimezoneOffset();
  return (z > 0 ? "-" : (z *= -1, "+"))
      + pad(z / 60 | 0, "0", 2)
      + pad(z % 60, "0", 2);
}

function formatUTCDayOfMonth(d, p) {
  return pad(d.getUTCDate(), p, 2);
}

function formatUTCHour24(d, p) {
  return pad(d.getUTCHours(), p, 2);
}

function formatUTCHour12(d, p) {
  return pad(d.getUTCHours() % 12 || 12, p, 2);
}

function formatUTCDayOfYear(d, p) {
  return pad(1 + utcDay.count(utcYear(d), d), p, 3);
}

function formatUTCMilliseconds(d, p) {
  return pad(d.getUTCMilliseconds(), p, 3);
}

function formatUTCMonthNumber(d, p) {
  return pad(d.getUTCMonth() + 1, p, 2);
}

function formatUTCMinutes(d, p) {
  return pad(d.getUTCMinutes(), p, 2);
}

function formatUTCSeconds(d, p) {
  return pad(d.getUTCSeconds(), p, 2);
}

function formatUTCWeekNumberSunday(d, p) {
  return pad(utcSunday.count(utcYear(d), d), p, 2);
}

function formatUTCWeekdayNumber(d) {
  return d.getUTCDay();
}

function formatUTCWeekNumberMonday(d, p) {
  return pad(utcMonday.count(utcYear(d), d), p, 2);
}

function formatUTCYear(d, p) {
  return pad(d.getUTCFullYear() % 100, p, 2);
}

function formatUTCFullYear(d, p) {
  return pad(d.getUTCFullYear() % 10000, p, 4);
}

function formatUTCZone() {
  return "+0000";
}

function formatLiteralPercent() {
  return "%";
}

var locale$1;


var utcFormat;
var utcParse;

defaultLocale$1({
  dateTime: "%x, %X",
  date: "%-m/%-d/%Y",
  time: "%-I:%M:%S %p",
  periods: ["AM", "PM"],
  days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
});

function defaultLocale$1(definition) {
  locale$1 = formatLocale$1(definition);
  utcFormat = locale$1.utcFormat;
  utcParse = locale$1.utcParse;
  return locale$1;
}

var isoSpecifier = "%Y-%m-%dT%H:%M:%S.%LZ";

function formatIsoNative(date) {
  return date.toISOString();
}

var formatIso = Date.prototype.toISOString
    ? formatIsoNative
    : utcFormat(isoSpecifier);

function parseIsoNative(string) {
  var date = new Date(string);
  return isNaN(date) ? null : date;
}

var parseIso = +new Date("2000-01-01T00:00:00.000Z")
    ? parseIsoNative
    : utcParse(isoSpecifier);

var colors = function(s) {
  return s.match(/.{6}/g).map(function(x) {
    return "#" + x;
  });
};

colors("1f77b4ff7f0e2ca02cd627289467bd8c564be377c27f7f7fbcbd2217becf");

colors("393b795254a36b6ecf9c9ede6379398ca252b5cf6bcedb9c8c6d31bd9e39e7ba52e7cb94843c39ad494ad6616be7969c7b4173a55194ce6dbdde9ed6");

colors("3182bd6baed69ecae1c6dbefe6550dfd8d3cfdae6bfdd0a231a35474c476a1d99bc7e9c0756bb19e9ac8bcbddcdadaeb636363969696bdbdbdd9d9d9");

colors("1f77b4aec7e8ff7f0effbb782ca02c98df8ad62728ff98969467bdc5b0d58c564bc49c94e377c2f7b6d27f7f7fc7c7c7bcbd22dbdb8d17becf9edae5");

cubehelixLong(cubehelix(300, 0.5, 0.0), cubehelix(-240, 0.5, 1.0));

var warm = cubehelixLong(cubehelix(-100, 0.75, 0.35), cubehelix(80, 1.50, 0.8));

var cool = cubehelixLong(cubehelix(260, 0.75, 0.35), cubehelix(80, 1.50, 0.8));

var rainbow = cubehelix();

function ramp(range) {
  var n = range.length;
  return function(t) {
    return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
  };
}

ramp(colors("44015444025645045745055946075a46085c460a5d460b5e470d60470e6147106347116447136548146748166848176948186a481a6c481b6d481c6e481d6f481f70482071482173482374482475482576482677482878482979472a7a472c7a472d7b472e7c472f7d46307e46327e46337f463480453581453781453882443983443a83443b84433d84433e85423f854240864241864142874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c508b3b518b3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8d355e8d355f8d34608d34618d33628d33638d32648e32658e31668e31678e31688e30698e306a8e2f6b8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e2c728e2c738e2b748e2b758e2a768e2a778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e26828e26828e25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8d218e8d218f8d21908d21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f998a1f9a8a1e9b8a1e9c891e9d891f9e891f9f881fa0881fa1881fa1871fa28720a38620a48621a58521a68522a78522a88423a98324aa8325ab8225ac8226ad8127ad8128ae8029af7f2ab07f2cb17e2db27d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb753dbc743fbc7340bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954c56856c66758c7655ac8645cc8635ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5870cf5773d05675d05477d1537ad1517cd2507fd34e81d34d84d44b86d54989d5488bd6468ed64590d74393d74195d84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32addc30b0dd2fb2dd2db5de2bb8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0e11cd2e21bd5e21ad8e219dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51cf1e51df4e61ef6e620f8e621fbe723fde725"));

var magma = ramp(colors("00000401000501010601010802010902020b02020d03030f03031204041405041606051806051a07061c08071e0907200a08220b09240c09260d0a290e0b2b100b2d110c2f120d31130d34140e36150e38160f3b180f3d19103f1a10421c10441d11471e114920114b21114e22115024125325125527125829115a2a115c2c115f2d11612f116331116533106734106936106b38106c390f6e3b0f703d0f713f0f72400f74420f75440f764510774710784910784a10794c117a4e117b4f127b51127c52137c54137d56147d57157e59157e5a167e5c167f5d177f5f187f601880621980641a80651a80671b80681c816a1c816b1d816d1d816e1e81701f81721f817320817521817621817822817922827b23827c23827e24828025828125818326818426818627818827818928818b29818c29818e2a81902a81912b81932b80942c80962c80982d80992d809b2e7f9c2e7f9e2f7fa02f7fa1307ea3307ea5317ea6317da8327daa337dab337cad347cae347bb0357bb2357bb3367ab5367ab73779b83779ba3878bc3978bd3977bf3a77c03a76c23b75c43c75c53c74c73d73c83e73ca3e72cc3f71cd4071cf4070d0416fd2426fd3436ed5446dd6456cd8456cd9466bdb476adc4869de4968df4a68e04c67e24d66e34e65e44f64e55064e75263e85362e95462ea5661eb5760ec5860ed5a5fee5b5eef5d5ef05f5ef1605df2625df2645cf3655cf4675cf4695cf56b5cf66c5cf66e5cf7705cf7725cf8745cf8765cf9785df9795df97b5dfa7d5efa7f5efa815ffb835ffb8560fb8761fc8961fc8a62fc8c63fc8e64fc9065fd9266fd9467fd9668fd9869fd9a6afd9b6bfe9d6cfe9f6dfea16efea36ffea571fea772fea973feaa74feac76feae77feb078feb27afeb47bfeb67cfeb77efeb97ffebb81febd82febf84fec185fec287fec488fec68afec88cfeca8dfecc8ffecd90fecf92fed194fed395fed597fed799fed89afdda9cfddc9efddea0fde0a1fde2a3fde3a5fde5a7fde7a9fde9aafdebacfcecaefceeb0fcf0b2fcf2b4fcf4b6fcf6b8fcf7b9fcf9bbfcfbbdfcfdbf"));

var inferno = ramp(colors("00000401000501010601010802010a02020c02020e03021004031204031405041706041907051b08051d09061f0a07220b07240c08260d08290e092b10092d110a30120a32140b34150b37160b39180c3c190c3e1b0c411c0c431e0c451f0c48210c4a230c4c240c4f260c51280b53290b552b0b572d0b592f0a5b310a5c320a5e340a5f3609613809623909633b09643d09653e0966400a67420a68440a68450a69470b6a490b6a4a0c6b4c0c6b4d0d6c4f0d6c510e6c520e6d540f6d550f6d57106e59106e5a116e5c126e5d126e5f136e61136e62146e64156e65156e67166e69166e6a176e6c186e6d186e6f196e71196e721a6e741a6e751b6e771c6d781c6d7a1d6d7c1d6d7d1e6d7f1e6c801f6c82206c84206b85216b87216b88226a8a226a8c23698d23698f24699025689225689326679526679727669827669a28659b29649d29649f2a63a02a63a22b62a32c61a52c60a62d60a82e5fa92e5eab2f5ead305dae305cb0315bb1325ab3325ab43359b63458b73557b93556ba3655bc3754bd3853bf3952c03a51c13a50c33b4fc43c4ec63d4dc73e4cc83f4bca404acb4149cc4248ce4347cf4446d04545d24644d34743d44842d54a41d74b3fd84c3ed94d3dda4e3cdb503bdd513ade5238df5337e05536e15635e25734e35933e45a31e55c30e65d2fe75e2ee8602de9612bea632aeb6429eb6628ec6726ed6925ee6a24ef6c23ef6e21f06f20f1711ff1731df2741cf3761bf37819f47918f57b17f57d15f67e14f68013f78212f78410f8850ff8870ef8890cf98b0bf98c0af98e09fa9008fa9207fa9407fb9606fb9706fb9906fb9b06fb9d07fc9f07fca108fca309fca50afca60cfca80dfcaa0ffcac11fcae12fcb014fcb216fcb418fbb61afbb81dfbba1ffbbc21fbbe23fac026fac228fac42afac62df9c72ff9c932f9cb35f8cd37f8cf3af7d13df7d340f6d543f6d746f5d949f5db4cf4dd4ff4df53f4e156f3e35af3e55df2e661f2e865f2ea69f1ec6df1ed71f1ef75f1f179f2f27df2f482f3f586f3f68af4f88ef5f992f6fa96f8fb9af9fc9dfafda1fcffa4"));

var plasma = ramp(colors("0d088710078813078916078a19068c1b068d1d068e20068f2206902406912605912805922a05932c05942e05952f059631059733059735049837049938049a3a049a3c049b3e049c3f049c41049d43039e44039e46039f48039f4903a04b03a14c02a14e02a25002a25102a35302a35502a45601a45801a45901a55b01a55c01a65e01a66001a66100a76300a76400a76600a76700a86900a86a00a86c00a86e00a86f00a87100a87201a87401a87501a87701a87801a87a02a87b02a87d03a87e03a88004a88104a78305a78405a78606a68707a68808a68a09a58b0aa58d0ba58e0ca48f0da4910ea3920fa39410a29511a19613a19814a099159f9a169f9c179e9d189d9e199da01a9ca11b9ba21d9aa31e9aa51f99a62098a72197a82296aa2395ab2494ac2694ad2793ae2892b02991b12a90b22b8fb32c8eb42e8db52f8cb6308bb7318ab83289ba3388bb3488bc3587bd3786be3885bf3984c03a83c13b82c23c81c33d80c43e7fc5407ec6417dc7427cc8437bc9447aca457acb4679cc4778cc4977cd4a76ce4b75cf4c74d04d73d14e72d24f71d35171d45270d5536fd5546ed6556dd7566cd8576bd9586ada5a6ada5b69db5c68dc5d67dd5e66de5f65de6164df6263e06363e16462e26561e26660e3685fe4695ee56a5de56b5de66c5ce76e5be76f5ae87059e97158e97257ea7457eb7556eb7655ec7754ed7953ed7a52ee7b51ef7c51ef7e50f07f4ff0804ef1814df1834cf2844bf3854bf3874af48849f48948f58b47f58c46f68d45f68f44f79044f79143f79342f89441f89540f9973ff9983ef99a3efa9b3dfa9c3cfa9e3bfb9f3afba139fba238fca338fca537fca636fca835fca934fdab33fdac33fdae32fdaf31fdb130fdb22ffdb42ffdb52efeb72dfeb82cfeba2cfebb2bfebd2afebe2afec029fdc229fdc328fdc527fdc627fdc827fdca26fdcb26fccd25fcce25fcd025fcd225fbd324fbd524fbd724fad824fada24f9dc24f9dd25f8df25f8e125f7e225f7e425f6e626f6e826f5e926f5eb27f4ed27f3ee27f3f027f2f227f1f426f1f525f0f724f0f921"));

var noop = {value: function() {}};

function dispatch() {
  for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
    if (!(t = arguments[i] + "") || (t in _)) { throw new Error("illegal type: " + t); }
    _[t] = [];
  }
  return new Dispatch(_);
}

function Dispatch(_) {
  this._ = _;
}

function parseTypenames(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) { name = t.slice(i + 1), t = t.slice(0, i); }
    if (t && !types.hasOwnProperty(t)) { throw new Error("unknown type: " + t); }
    return {type: t, name: name};
  });
}

Dispatch.prototype = dispatch.prototype = {
  constructor: Dispatch,
  on: function(typename, callback) {
    var _ = this._,
        T = parseTypenames(typename + "", _),
        t,
        i = -1,
        n = T.length;

    // If no callback was specified, return the callback of the given type and name.
    if (arguments.length < 2) {
      while (++i < n) { if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name))) { return t; } }
      return;
    }

    // If a type was specified, set the callback for the given type and name.
    // Otherwise, if a null callback was specified, remove callbacks of the given name.
    if (callback != null && typeof callback !== "function") { throw new Error("invalid callback: " + callback); }
    while (++i < n) {
      if (t = (typename = T[i]).type) { _[t] = set$2(_[t], typename.name, callback); }
      else if (callback == null) { for (t in _) { _[t] = set$2(_[t], typename.name, null); } }
    }

    return this;
  },
  copy: function() {
    var copy = {}, _ = this._;
    for (var t in _) { copy[t] = _[t].slice(); }
    return new Dispatch(copy);
  },
  call: function(type, that) {
    if ((n = arguments.length - 2) > 0) { for (var args = new Array(n), i = 0, n, t; i < n; ++i) { args[i] = arguments[i + 2]; } }
    if (!this._.hasOwnProperty(type)) { throw new Error("unknown type: " + type); }
    for (t = this._[type], i = 0, n = t.length; i < n; ++i) { t[i].value.apply(that, args); }
  },
  apply: function(type, that, args) {
    if (!this._.hasOwnProperty(type)) { throw new Error("unknown type: " + type); }
    for (var t = this._[type], i = 0, n = t.length; i < n; ++i) { t[i].value.apply(that, args); }
  }
};

function get(type, name) {
  for (var i = 0, n = type.length, c; i < n; ++i) {
    if ((c = type[i]).name === name) {
      return c.value;
    }
  }
}

function set$2(type, name, callback) {
  for (var i = 0, n = type.length; i < n; ++i) {
    if (type[i].name === name) {
      type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
      break;
    }
  }
  if (callback != null) { type.push({name: name, value: callback}); }
  return type;
}

var xhtml = "http://www.w3.org/1999/xhtml";

var namespaces = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: xhtml,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};

var namespace = function(name) {
  var prefix = name += "", i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") { name = name.slice(i + 1); }
  return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name;
};

function creatorInherit(name) {
  return function() {
    var document = this.ownerDocument,
        uri = this.namespaceURI;
    return uri === xhtml && document.documentElement.namespaceURI === xhtml
        ? document.createElement(name)
        : document.createElementNS(uri, name);
  };
}

function creatorFixed(fullname) {
  return function() {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}

var creator = function(name) {
  var fullname = namespace(name);
  return (fullname.local
      ? creatorFixed
      : creatorInherit)(fullname);
};

var matcher = function(selector) {
  return function() {
    return this.matches(selector);
  };
};

if (typeof document !== "undefined") {
  var element = document.documentElement;
  if (!element.matches) {
    var vendorMatches = element.webkitMatchesSelector
        || element.msMatchesSelector
        || element.mozMatchesSelector
        || element.oMatchesSelector;
    matcher = function(selector) {
      return function() {
        return vendorMatches.call(this, selector);
      };
    };
  }
}

var matcher$1 = matcher;

var filterEvents = {};

var event = null;

if (typeof document !== "undefined") {
  var element$1 = document.documentElement;
  if (!("onmouseenter" in element$1)) {
    filterEvents = {mouseenter: "mouseover", mouseleave: "mouseout"};
  }
}

function filterContextListener(listener, index, group) {
  listener = contextListener(listener, index, group);
  return function(event) {
    var related = event.relatedTarget;
    if (!related || (related !== this && !(related.compareDocumentPosition(this) & 8))) {
      listener.call(this, event);
    }
  };
}

function contextListener(listener, index, group) {
  return function(event1) {
    var event0 = event; // Events can be reentrant (e.g., focus).
    event = event1;
    try {
      listener.call(this, this.__data__, index, group);
    } finally {
      event = event0;
    }
  };
}

function parseTypenames$1(typenames) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) { name = t.slice(i + 1), t = t.slice(0, i); }
    return {type: t, name: name};
  });
}

function onRemove(typename) {
  return function() {
    var on = this.__on;
    if (!on) { return; }
    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
      if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.capture);
      } else {
        on[++i] = o;
      }
    }
    if (++i) { on.length = i; }
    else { delete this.__on; }
  };
}

function onAdd(typename, value, capture) {
  var wrap = filterEvents.hasOwnProperty(typename.type) ? filterContextListener : contextListener;
  return function(d, i, group) {
    var on = this.__on, o, listener = wrap(value, i, group);
    if (on) { for (var j = 0, m = on.length; j < m; ++j) {
      if ((o = on[j]).type === typename.type && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.capture);
        this.addEventListener(o.type, o.listener = listener, o.capture = capture);
        o.value = value;
        return;
      }
    } }
    this.addEventListener(typename.type, listener, capture);
    o = {type: typename.type, name: typename.name, value: value, listener: listener, capture: capture};
    if (!on) { this.__on = [o]; }
    else { on.push(o); }
  };
}

var selection_on = function(typename, value, capture) {
  var typenames = parseTypenames$1(typename + ""), i, n = typenames.length, t;

  if (arguments.length < 2) {
    var on = this.node().__on;
    if (on) { for (var j = 0, m = on.length, o; j < m; ++j) {
      for (i = 0, o = on[j]; i < n; ++i) {
        if ((t = typenames[i]).type === o.type && t.name === o.name) {
          return o.value;
        }
      }
    } }
    return;
  }

  on = value ? onAdd : onRemove;
  if (capture == null) { capture = false; }
  for (i = 0; i < n; ++i) { this.each(on(typenames[i], value, capture)); }
  return this;
};

function customEvent(event1, listener, that, args) {
  var event0 = event;
  event1.sourceEvent = event;
  event = event1;
  try {
    return listener.apply(that, args);
  } finally {
    event = event0;
  }
}

var sourceEvent = function() {
  var current = event, source;
  while (source = current.sourceEvent) { current = source; }
  return current;
};

var point$1 = function(node, event) {
  var svg = node.ownerSVGElement || node;

  if (svg.createSVGPoint) {
    var point = svg.createSVGPoint();
    point.x = event.clientX, point.y = event.clientY;
    point = point.matrixTransform(node.getScreenCTM().inverse());
    return [point.x, point.y];
  }

  var rect = node.getBoundingClientRect();
  return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
};

var mouse = function(node) {
  var event = sourceEvent();
  if (event.changedTouches) { event = event.changedTouches[0]; }
  return point$1(node, event);
};

function none() {}

var selector = function(selector) {
  return selector == null ? none : function() {
    return this.querySelector(selector);
  };
};

var selection_select = function(select) {
  if (typeof select !== "function") { select = selector(select); }

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) { subnode.__data__ = node.__data__; }
        subgroup[i] = subnode;
      }
    }
  }

  return new Selection(subgroups, this._parents);
};

function empty() {
  return [];
}

var selectorAll = function(selector) {
  return selector == null ? empty : function() {
    return this.querySelectorAll(selector);
  };
};

var selection_selectAll = function(select) {
  if (typeof select !== "function") { select = selectorAll(select); }

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        subgroups.push(select.call(node, node.__data__, i, group));
        parents.push(node);
      }
    }
  }

  return new Selection(subgroups, parents);
};

var selection_filter = function(match) {
  if (typeof match !== "function") { match = matcher$1(match); }

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Selection(subgroups, this._parents);
};

var sparse = function(update) {
  return new Array(update.length);
};

var selection_enter = function() {
  return new Selection(this._enter || this._groups.map(sparse), this._parents);
};

function EnterNode(parent, datum) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum;
}

EnterNode.prototype = {
  constructor: EnterNode,
  appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
  insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
  querySelector: function(selector) { return this._parent.querySelector(selector); },
  querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
};

var constant$3 = function(x) {
  return function() {
    return x;
  };
};

var keyPrefix = "$"; // Protect against keys like “__proto__”.

function bindIndex(parent, group, enter, update, exit, data) {
  var i = 0,
      node,
      groupLength = group.length,
      dataLength = data.length;

  // Put any non-null nodes that fit into update.
  // Put any null nodes into enter.
  // Put any remaining data into enter.
  for (; i < dataLength; ++i) {
    if (node = group[i]) {
      node.__data__ = data[i];
      update[i] = node;
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }

  // Put any non-null nodes that don’t fit into exit.
  for (; i < groupLength; ++i) {
    if (node = group[i]) {
      exit[i] = node;
    }
  }
}

function bindKey(parent, group, enter, update, exit, data, key) {
  var i,
      node,
      nodeByKeyValue = {},
      groupLength = group.length,
      dataLength = data.length,
      keyValues = new Array(groupLength),
      keyValue;

  // Compute the key for each node.
  // If multiple nodes have the same key, the duplicates are added to exit.
  for (i = 0; i < groupLength; ++i) {
    if (node = group[i]) {
      keyValues[i] = keyValue = keyPrefix + key.call(node, node.__data__, i, group);
      if (keyValue in nodeByKeyValue) {
        exit[i] = node;
      } else {
        nodeByKeyValue[keyValue] = node;
      }
    }
  }

  // Compute the key for each datum.
  // If there a node associated with this key, join and add it to update.
  // If there is not (or the key is a duplicate), add it to enter.
  for (i = 0; i < dataLength; ++i) {
    keyValue = keyPrefix + key.call(parent, data[i], i, data);
    if (node = nodeByKeyValue[keyValue]) {
      update[i] = node;
      node.__data__ = data[i];
      nodeByKeyValue[keyValue] = null;
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }

  // Add any remaining nodes that were not bound to data to exit.
  for (i = 0; i < groupLength; ++i) {
    if ((node = group[i]) && (nodeByKeyValue[keyValues[i]] === node)) {
      exit[i] = node;
    }
  }
}

var selection_data = function(value, key) {
  if (!value) {
    data = new Array(this.size()), j = -1;
    this.each(function(d) { data[++j] = d; });
    return data;
  }

  var bind = key ? bindKey : bindIndex,
      parents = this._parents,
      groups = this._groups;

  if (typeof value !== "function") { value = constant$3(value); }

  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
    var parent = parents[j],
        group = groups[j],
        groupLength = group.length,
        data = value.call(parent, parent && parent.__data__, j, parents),
        dataLength = data.length,
        enterGroup = enter[j] = new Array(dataLength),
        updateGroup = update[j] = new Array(dataLength),
        exitGroup = exit[j] = new Array(groupLength);

    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

    // Now connect the enter nodes to their following update node, such that
    // appendChild can insert the materialized enter node before this node,
    // rather than at the end of the parent node.
    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
      if (previous = enterGroup[i0]) {
        if (i0 >= i1) { i1 = i0 + 1; }
        while (!(next = updateGroup[i1]) && ++i1 < dataLength){  }
        previous._next = next || null;
      }
    }
  }

  update = new Selection(update, parents);
  update._enter = enter;
  update._exit = exit;
  return update;
};

var selection_exit = function() {
  return new Selection(this._exit || this._groups.map(sparse), this._parents);
};

var selection_merge = function(selection$$1) {

  for (var groups0 = this._groups, groups1 = selection$$1._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Selection(merges, this._parents);
};

var selection_order = function() {

  for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
    for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
      if (node = group[i]) {
        if (next && next !== node.nextSibling) { next.parentNode.insertBefore(node, next); }
        next = node;
      }
    }
  }

  return this;
};

var selection_sort = function(compare) {
  if (!compare) { compare = ascending$1; }

  function compareNode(a, b) {
    return a && b ? compare(a.__data__, b.__data__) : !a - !b;
  }

  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        sortgroup[i] = node;
      }
    }
    sortgroup.sort(compareNode);
  }

  return new Selection(sortgroups, this._parents).order();
};

function ascending$1(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

var selection_call = function() {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
};

var selection_nodes = function() {
  var nodes = new Array(this.size()), i = -1;
  this.each(function() { nodes[++i] = this; });
  return nodes;
};

var selection_node = function() {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
      var node = group[i];
      if (node) { return node; }
    }
  }

  return null;
};

var selection_size = function() {
  var size = 0;
  this.each(function() { ++size; });
  return size;
};

var selection_empty = function() {
  return !this.node();
};

var selection_each = function(callback) {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) { callback.call(node, node.__data__, i, group); }
    }
  }

  return this;
};

function attrRemove(name) {
  return function() {
    this.removeAttribute(name);
  };
}

function attrRemoveNS(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant(name, value) {
  return function() {
    this.setAttribute(name, value);
  };
}

function attrConstantNS(fullname, value) {
  return function() {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}

function attrFunction(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) { this.removeAttribute(name); }
    else { this.setAttribute(name, v); }
  };
}

function attrFunctionNS(fullname, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) { this.removeAttributeNS(fullname.space, fullname.local); }
    else { this.setAttributeNS(fullname.space, fullname.local, v); }
  };
}

var selection_attr = function(name, value) {
  var fullname = namespace(name);

  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local
        ? node.getAttributeNS(fullname.space, fullname.local)
        : node.getAttribute(fullname);
  }

  return this.each((value == null
      ? (fullname.local ? attrRemoveNS : attrRemove) : (typeof value === "function"
      ? (fullname.local ? attrFunctionNS : attrFunction)
      : (fullname.local ? attrConstantNS : attrConstant)))(fullname, value));
};

var defaultView = function(node) {
  return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
      || (node.document && node) // node is a Window
      || node.defaultView; // node is a Document
};

function styleRemove(name) {
  return function() {
    this.style.removeProperty(name);
  };
}

function styleConstant(name, value, priority) {
  return function() {
    this.style.setProperty(name, value, priority);
  };
}

function styleFunction(name, value, priority) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) { this.style.removeProperty(name); }
    else { this.style.setProperty(name, v, priority); }
  };
}

var selection_style = function(name, value, priority) {
  return arguments.length > 1
      ? this.each((value == null
            ? styleRemove : typeof value === "function"
            ? styleFunction
            : styleConstant)(name, value, priority == null ? "" : priority))
      : styleValue(this.node(), name);
};

function styleValue(node, name) {
  return node.style.getPropertyValue(name)
      || defaultView(node).getComputedStyle(node, null).getPropertyValue(name);
}

function propertyRemove(name) {
  return function() {
    delete this[name];
  };
}

function propertyConstant(name, value) {
  return function() {
    this[name] = value;
  };
}

function propertyFunction(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) { delete this[name]; }
    else { this[name] = v; }
  };
}

var selection_property = function(name, value) {
  return arguments.length > 1
      ? this.each((value == null
          ? propertyRemove : typeof value === "function"
          ? propertyFunction
          : propertyConstant)(name, value))
      : this.node()[name];
};

function classArray(string) {
  return string.trim().split(/^|\s+/);
}

function classList(node) {
  return node.classList || new ClassList(node);
}

function ClassList(node) {
  this._node = node;
  this._names = classArray(node.getAttribute("class") || "");
}

ClassList.prototype = {
  add: function(name) {
    var i = this._names.indexOf(name);
    if (i < 0) {
      this._names.push(name);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function(name) {
    var i = this._names.indexOf(name);
    if (i >= 0) {
      this._names.splice(i, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function(name) {
    return this._names.indexOf(name) >= 0;
  }
};

function classedAdd(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n) { list.add(names[i]); }
}

function classedRemove(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n) { list.remove(names[i]); }
}

function classedTrue(names) {
  return function() {
    classedAdd(this, names);
  };
}

function classedFalse(names) {
  return function() {
    classedRemove(this, names);
  };
}

function classedFunction(names, value) {
  return function() {
    (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
  };
}

var selection_classed = function(name, value) {
  var names = classArray(name + "");

  if (arguments.length < 2) {
    var list = classList(this.node()), i = -1, n = names.length;
    while (++i < n) { if (!list.contains(names[i])) { return false; } }
    return true;
  }

  return this.each((typeof value === "function"
      ? classedFunction : value
      ? classedTrue
      : classedFalse)(names, value));
};

function textRemove() {
  this.textContent = "";
}

function textConstant(value) {
  return function() {
    this.textContent = value;
  };
}

function textFunction(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.textContent = v == null ? "" : v;
  };
}

var selection_text = function(value) {
  return arguments.length
      ? this.each(value == null
          ? textRemove : (typeof value === "function"
          ? textFunction
          : textConstant)(value))
      : this.node().textContent;
};

function htmlRemove() {
  this.innerHTML = "";
}

function htmlConstant(value) {
  return function() {
    this.innerHTML = value;
  };
}

function htmlFunction(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.innerHTML = v == null ? "" : v;
  };
}

var selection_html = function(value) {
  return arguments.length
      ? this.each(value == null
          ? htmlRemove : (typeof value === "function"
          ? htmlFunction
          : htmlConstant)(value))
      : this.node().innerHTML;
};

function raise$1() {
  if (this.nextSibling) { this.parentNode.appendChild(this); }
}

var selection_raise = function() {
  return this.each(raise$1);
};

function lower() {
  if (this.previousSibling) { this.parentNode.insertBefore(this, this.parentNode.firstChild); }
}

var selection_lower = function() {
  return this.each(lower);
};

var selection_append = function(name) {
  var create = typeof name === "function" ? name : creator(name);
  return this.select(function() {
    return this.appendChild(create.apply(this, arguments));
  });
};

function constantNull() {
  return null;
}

var selection_insert = function(name, before) {
  var create = typeof name === "function" ? name : creator(name),
      select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
  return this.select(function() {
    return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
  });
};

function remove() {
  var parent = this.parentNode;
  if (parent) { parent.removeChild(this); }
}

var selection_remove = function() {
  return this.each(remove);
};

var selection_datum = function(value) {
  return arguments.length
      ? this.property("__data__", value)
      : this.node().__data__;
};

function dispatchEvent(node, type, params) {
  var window = defaultView(node),
      event = window.CustomEvent;

  if (typeof event === "function") {
    event = new event(type, params);
  } else {
    event = window.document.createEvent("Event");
    if (params) { event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail; }
    else { event.initEvent(type, false, false); }
  }

  node.dispatchEvent(event);
}

function dispatchConstant(type, params) {
  return function() {
    return dispatchEvent(this, type, params);
  };
}

function dispatchFunction(type, params) {
  return function() {
    return dispatchEvent(this, type, params.apply(this, arguments));
  };
}

var selection_dispatch = function(type, params) {
  return this.each((typeof params === "function"
      ? dispatchFunction
      : dispatchConstant)(type, params));
};

var root = [null];

function Selection(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}

function selection() {
  return new Selection([[document.documentElement]], root);
}

Selection.prototype = selection.prototype = {
  constructor: Selection,
  select: selection_select,
  selectAll: selection_selectAll,
  filter: selection_filter,
  data: selection_data,
  enter: selection_enter,
  exit: selection_exit,
  merge: selection_merge,
  order: selection_order,
  sort: selection_sort,
  call: selection_call,
  nodes: selection_nodes,
  node: selection_node,
  size: selection_size,
  empty: selection_empty,
  each: selection_each,
  attr: selection_attr,
  style: selection_style,
  property: selection_property,
  classed: selection_classed,
  text: selection_text,
  html: selection_html,
  raise: selection_raise,
  lower: selection_lower,
  append: selection_append,
  insert: selection_insert,
  remove: selection_remove,
  datum: selection_datum,
  on: selection_on,
  dispatch: selection_dispatch
};

var select = function(selector) {
  return typeof selector === "string"
      ? new Selection([[document.querySelector(selector)]], [document.documentElement])
      : new Selection([[selector]], root);
};

var touch = function(node, touches, identifier) {
  if (arguments.length < 3) { identifier = touches, touches = sourceEvent().changedTouches; }

  for (var i = 0, n = touches ? touches.length : 0, touch; i < n; ++i) {
    if ((touch = touches[i]).identifier === identifier) {
      return point$1(node, touch);
    }
  }

  return null;
};

function nopropagation() {
  event.stopImmediatePropagation();
}

var noevent = function() {
  event.preventDefault();
  event.stopImmediatePropagation();
};

var nodrag = function(view) {
  var root = view.document.documentElement,
      selection = select(view).on("dragstart.drag", noevent, true);
  if ("onselectstart" in root) {
    selection.on("selectstart.drag", noevent, true);
  } else {
    root.__noselect = root.style.MozUserSelect;
    root.style.MozUserSelect = "none";
  }
};

function yesdrag(view, noclick) {
  var root = view.document.documentElement,
      selection = select(view).on("dragstart.drag", null);
  if (noclick) {
    selection.on("click.drag", noevent, true);
    setTimeout(function() { selection.on("click.drag", null); }, 0);
  }
  if ("onselectstart" in root) {
    selection.on("selectstart.drag", null);
  } else {
    root.style.MozUserSelect = root.__noselect;
    delete root.__noselect;
  }
}

var constant$4 = function(x) {
  return function() {
    return x;
  };
};

function DragEvent(target, type, subject, id, active, x, y, dx, dy, dispatch) {
  this.target = target;
  this.type = type;
  this.subject = subject;
  this.identifier = id;
  this.active = active;
  this.x = x;
  this.y = y;
  this.dx = dx;
  this.dy = dy;
  this._ = dispatch;
}

DragEvent.prototype.on = function() {
  var value = this._.on.apply(this._, arguments);
  return value === this._ ? this : value;
};

// Ignore right-click, since that should open the context menu.
function defaultFilter() {
  return !event.button;
}

function defaultContainer() {
  return this.parentNode;
}

function defaultSubject(d) {
  return d == null ? {x: event.x, y: event.y} : d;
}

function defaultTouchable() {
  return "ontouchstart" in this;
}

var drag = function() {
  var filter = defaultFilter,
      container = defaultContainer,
      subject = defaultSubject,
      touchable = defaultTouchable,
      gestures = {},
      listeners = dispatch("start", "drag", "end"),
      active = 0,
      mousedownx,
      mousedowny,
      mousemoving,
      touchending,
      clickDistance2 = 0;

  function drag(selection) {
    selection
        .on("mousedown.drag", mousedowned)
      .filter(touchable)
        .on("touchstart.drag", touchstarted)
        .on("touchmove.drag", touchmoved)
        .on("touchend.drag touchcancel.drag", touchended)
        .style("touch-action", "none")
        .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
  }

  function mousedowned() {
    if (touchending || !filter.apply(this, arguments)) { return; }
    var gesture = beforestart("mouse", container.apply(this, arguments), mouse, this, arguments);
    if (!gesture) { return; }
    select(event.view).on("mousemove.drag", mousemoved, true).on("mouseup.drag", mouseupped, true);
    nodrag(event.view);
    nopropagation();
    mousemoving = false;
    mousedownx = event.clientX;
    mousedowny = event.clientY;
    gesture("start");
  }

  function mousemoved() {
    noevent();
    if (!mousemoving) {
      var dx = event.clientX - mousedownx, dy = event.clientY - mousedowny;
      mousemoving = dx * dx + dy * dy > clickDistance2;
    }
    gestures.mouse("drag");
  }

  function mouseupped() {
    select(event.view).on("mousemove.drag mouseup.drag", null);
    yesdrag(event.view, mousemoving);
    noevent();
    gestures.mouse("end");
  }

  function touchstarted() {
    if (!filter.apply(this, arguments)) { return; }
    var touches = event.changedTouches,
        c = container.apply(this, arguments),
        n = touches.length, i, gesture;

    for (i = 0; i < n; ++i) {
      if (gesture = beforestart(touches[i].identifier, c, touch, this, arguments)) {
        nopropagation();
        gesture("start");
      }
    }
  }

  function touchmoved() {
    var touches = event.changedTouches,
        n = touches.length, i, gesture;

    for (i = 0; i < n; ++i) {
      if (gesture = gestures[touches[i].identifier]) {
        noevent();
        gesture("drag");
      }
    }
  }

  function touchended() {
    var touches = event.changedTouches,
        n = touches.length, i, gesture;

    if (touchending) { clearTimeout(touchending); }
    touchending = setTimeout(function() { touchending = null; }, 500); // Ghost clicks are delayed!
    for (i = 0; i < n; ++i) {
      if (gesture = gestures[touches[i].identifier]) {
        nopropagation();
        gesture("end");
      }
    }
  }

  function beforestart(id, container, point, that, args) {
    var p = point(container, id), s, dx, dy,
        sublisteners = listeners.copy();

    if (!customEvent(new DragEvent(drag, "beforestart", s, id, active, p[0], p[1], 0, 0, sublisteners), function() {
      if ((event.subject = s = subject.apply(that, args)) == null) { return false; }
      dx = s.x - p[0] || 0;
      dy = s.y - p[1] || 0;
      return true;
    })) { return; }

    return function gesture(type) {
      var p0 = p, n;
      switch (type) {
        case "start": gestures[id] = gesture, n = active++; break;
        case "end": delete gestures[id], --active; // nobreak
        case "drag": p = point(container, id), n = active; break;
      }
      customEvent(new DragEvent(drag, type, s, id, n, p[0] + dx, p[1] + dy, p[0] - p0[0], p[1] - p0[1], sublisteners), sublisteners.apply, sublisteners, [type, that, args]);
    };
  }

  drag.filter = function(_) {
    return arguments.length ? (filter = typeof _ === "function" ? _ : constant$4(!!_), drag) : filter;
  };

  drag.container = function(_) {
    return arguments.length ? (container = typeof _ === "function" ? _ : constant$4(_), drag) : container;
  };

  drag.subject = function(_) {
    return arguments.length ? (subject = typeof _ === "function" ? _ : constant$4(_), drag) : subject;
  };

  drag.touchable = function(_) {
    return arguments.length ? (touchable = typeof _ === "function" ? _ : constant$4(!!_), drag) : touchable;
  };

  drag.on = function() {
    var value = listeners.on.apply(listeners, arguments);
    return value === listeners ? drag : value;
  };

  drag.clickDistance = function(_) {
    return arguments.length ? (clickDistance2 = (_ = +_) * _, drag) : Math.sqrt(clickDistance2);
  };

  return drag;
};

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const T$10 = Template('d-slider', `
<style>
  :host {
    position: relative;
    display: inline-block;
  }

  :host(:focus) {
    outline: none;
  }

  .background {
    padding: 9px 0;
    color: white;
    position: relative;
  }

  .track {
    height: 3px;
    width: 100%;
    border-radius: 2px;
    background-color: hsla(0, 0%, 0%, 0.2);
  }

  .track-fill {
    position: absolute;
    top: 9px;
    height: 3px;
    border-radius: 4px;
    background-color: hsl(24, 100%, 50%);
  }

  .knob-container {
    position: absolute;
    top: 10px;
  }

  .knob {
    position: absolute;
    top: -6px;
    left: -6px;
    width: 13px;
    height: 13px;
    background-color: hsl(24, 100%, 50%);
    border-radius: 50%;
    transition-property: transform;
    transition-duration: 0.18s;
    transition-timing-function: ease;
  }
  .mousedown .knob {
    transform: scale(1.5);
  }

  .knob-highlight {
    position: absolute;
    top: -6px;
    left: -6px;
    width: 13px;
    height: 13px;
    background-color: hsla(0, 0%, 0%, 0.1);
    border-radius: 50%;
    transition-property: transform;
    transition-duration: 0.18s;
    transition-timing-function: ease;
  }

  .focus .knob-highlight {
    transform: scale(2);
  }

  .ticks {
    position: absolute;
    top: 16px;
    height: 4px;
    width: 100%;
    z-index: -1;
  }

  .ticks .tick {
    position: absolute;
    height: 100%;
    border-left: 1px solid hsla(0, 0%, 0%, 0.2);
  }

</style>

  <div class='background'>
    <div class='track'></div>
    <div class='track-fill'></div>
    <div class='knob-container'>
      <div class='knob-highlight'></div>
      <div class='knob'></div>
    </div>
    <div class='ticks'></div>
  </div>
`);

// ARIA
// If the slider has a visible label, it is referenced by aria-labelledby on the slider element. Otherwise, the slider element has a label provided by aria-label.
// If the slider is vertically oriented, it has aria-orientation set to vertical. The default value of aria-orientation for a slider is horizontal.

const keyCodes = {
  left: 37,
  up: 38,
  right: 39,
  down: 40,
  pageUp: 33,
  pageDown: 34,
  end: 35,
  home: 36
};

class Slider extends T$10(HTMLElement) {


  connectedCallback() {
    this.connected = true;
    this.setAttribute('role', 'slider');
    // Makes the element tab-able.
    if (!this.hasAttribute('tabindex')) { this.setAttribute('tabindex', 0); }

    // Keeps track of keyboard vs. mouse interactions for focus rings
    this.mouseEvent = false;

    // Handles to shadow DOM elements
    this.knob = this.root.querySelector('.knob-container');
    this.background = this.root.querySelector('.background');
    this.trackFill = this.root.querySelector('.track-fill');
    this.track = this.root.querySelector('.track');

    // Default values for attributes
    this.min = this.min ? this.min : 0;
    this.max = this.max ? this.max : 100;
    this.scale = linear().domain([this.min, this.max]).range([0, 1]).clamp(true);

    this.origin = this.origin !== undefined ? this.origin : this.min;
    this.step = this.step ? this.step : 1;
    this.update(this.value ? this.value : 0);

    this.ticks = this.ticks ? this.ticks : false;
    this.renderTicks();

    this.drag = drag()
      .container(this.background)
      .on('start', () => {
        this.mouseEvent = true;
        this.background.classList.add('mousedown');
        this.changeValue = this.value;
        this.dragUpdate();
      })
      .on('drag', () => {
        this.dragUpdate();
      })
      .on('end', () => {
        this.mouseEvent = false;
        this.background.classList.remove('mousedown');
        this.dragUpdate();
        if (this.changeValue !== this.value) { this.dispatchChange(); }
        this.changeValue = this.value;
      });
    this.drag(select(this.background));

    this.addEventListener('focusin', () => {
      if(!this.mouseEvent) {
        this.background.classList.add('focus');
      }
    });
    this.addEventListener('focusout', () => {
      this.background.classList.remove('focus');
    });
    this.addEventListener('keydown', this.onKeyDown);

  }

  static get observedAttributes() {return ['min', 'max', 'value', 'step', 'ticks', 'origin', 'tickValues', 'tickLabels']; }

  attributeChangedCallback(attr, oldValue, newValue) {
    if (isNaN(newValue) || newValue === undefined || newValue === null) { return; }
    if (attr == 'min') {
      this.min = +newValue;
      this.setAttribute('aria-valuemin', this.min);
    }
    if (attr == 'max') {
      this.max = +newValue;
      this.setAttribute('aria-valuemax', this.max);
    }
    if (attr == 'value') {
      this.update(+newValue);
    }
    if (attr == 'origin') {
      this.origin = +newValue;
      // this.update(this.value);
    }
    if (attr == 'step') {
      if (newValue > 0) {
        this.step = +newValue;
      }
    }
    if (attr == 'ticks') {
      this.ticks = (newValue === '' ? true : newValue);
    }
  }

  onKeyDown(event$$1) {
    this.changeValue = this.value;
    let stopPropagation = false;
    switch (event$$1.keyCode) {
    case keyCodes.left:
    case keyCodes.down:
      this.update(this.value - this.step);
      stopPropagation = true;
      break;
    case keyCodes.right:
    case keyCodes.up:
      this.update(this.value + this.step);
      stopPropagation = true;
      break;
    case keyCodes.pageUp:
      this.update(this.value + this.step * 10);
      stopPropagation = true;
      break;

    case keyCodes.pageDown:
      this.update(this.value + this.step * 10);
      stopPropagation = true;
      break;
    case keyCodes.home:
      this.update(this.min);
      stopPropagation = true;
      break;
    case keyCodes.end:
      this.update(this.max);
      stopPropagation = true;
      break;
    default:
      break;
    }
    if (stopPropagation) {
      this.background.classList.add('focus');
      event$$1.preventDefault();
      event$$1.stopPropagation();
      if (this.changeValue !== this.value) { this.dispatchChange(); }
    }
  }

  validateValueRange(min, max, value) {
    return Math.max(Math.min(max, value), min);
  }

  quantizeValue(value, step) {
    return Math.round(value / step) * step;
  }

  dragUpdate() {
    const bbox = this.background.getBoundingClientRect();
    const x = event.x;
    const width = bbox.width;
    this.update(this.scale.invert(x / width));
  }

  update(value) {
    let v = value;
    if (this.step !== 'any') {
      v = this.quantizeValue(value, this.step);
    }
    v = this.validateValueRange(this.min, this.max, v);
    if (this.connected) {
      this.knob.style.left = this.scale(v) * 100 + '%';
      this.trackFill.style.width = this.scale(this.min + Math.abs(v - this.origin)) * 100 + '%';
      this.trackFill.style.left = this.scale(Math.min(v, this.origin)) * 100 + '%';
    }
    if (this.value !== v) {
      this.value = v;
      this.setAttribute('aria-valuenow', this.value);
      this.dispatchInput();
    }
  }

  // Dispatches only on a committed change (basically only on mouseup).
  dispatchChange() {
    const e = new Event('change');
    this.dispatchEvent(e, {});
  }

  // Dispatches on each value change.
  dispatchInput() {
    const e = new Event('input');
    this.dispatchEvent(e, {});
  }

  renderTicks() {
    const ticksContainer = this.root.querySelector('.ticks');
    if (this.ticks !== false) {
      let tickData = [];
      if (this.ticks > 0) {
        tickData = this.scale.ticks(this.ticks);
      } else if (this.step === 'any') {
        tickData = this.scale.ticks();
      } else {
        tickData = range(this.min, this.max + 1e-6, this.step);
      }
      tickData.forEach(d => {
        const tick = document.createElement('div');
        tick.classList.add('tick');
        tick.style.left = this.scale(d) * 100 + '%';
        ticksContainer.appendChild(tick);
      });
    } else {
      ticksContainer.style.display = 'none';
    }
  }
}

var logo = "<svg viewBox=\"-607 419 64 64\">\r\n  <path d=\"M-573.4,478.9c-8,0-14.6-6.4-14.6-14.5s14.6-25.9,14.6-40.8c0,14.9,14.6,32.8,14.6,40.8S-565.4,478.9-573.4,478.9z\"/>\r\n</svg>\r\n";

const headerTemplate = `
<style>
distill-header {
  position: relative;
  height: 60px;
  background-color: hsl(200, 60%, 15%);
  width: 100%;
  box-sizing: border-box;
  z-index: 2;
  color: rgba(0, 0, 0, 0.8);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
}
distill-header .content {
  height: 70px;
  grid-column: page;
}
distill-header a {
  font-size: 16px;
  height: 60px;
  line-height: 60px;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.8);
  padding: 22px 0;
}
distill-header a:hover {
  color: rgba(255, 255, 255, 1);
}
distill-header svg {
  width: 24px;
  position: relative;
  top: 4px;
  margin-right: 2px;
}
@media(min-width: 1080px) {
  distill-header {
    height: 70px;
  }
  distill-header a {
    height: 70px;
    line-height: 70px;
    padding: 28px 0;
  }
  distill-header .logo {
  }
}
distill-header svg path {
  fill: none;
  stroke: rgba(255, 255, 255, 0.8);
  stroke-width: 3px;
}
distill-header .logo {
  font-size: 17px;
  font-weight: 200;
}
distill-header .nav {
  float: right;
  font-weight: 300;
}
distill-header .nav a {
  font-size: 12px;
  margin-left: 24px;
  text-transform: uppercase;
}
</style>
<div class="content">
  <a href="/" class="logo">
    ${logo}
    Distill
  </a>
  <nav class="nav">
    <a href="/about/">About</a>
    <a href="/prize/">Prize</a>
    <a href="/journal/">Submit</a>
  </nav>
</div>
`;

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const T$11 = Template('distill-header', headerTemplate, false);

class DistillHeader extends T$11(HTMLElement) {

}

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const styles$2 = `
<style>
  distill-appendix {
    contain: layout style;
  }

  distill-appendix .citation {
    font-size: 11px;
    line-height: 15px;
    border-left: 1px solid rgba(0, 0, 0, 0.1);
    padding-left: 18px;
    border: 1px solid rgba(0,0,0,0.1);
    background: rgba(0, 0, 0, 0.02);
    padding: 10px 18px;
    border-radius: 3px;
    color: rgba(150, 150, 150, 1);
    overflow: hidden;
    margin-top: -12px;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  distill-appendix > * {
    grid-column: text;
  }
</style>
`;

function appendixTemplate(frontMatter) {
  let html = styles$2;

  if (typeof frontMatter.githubUrl !== 'undefined') {
    html += `
    <h3 id="updates-and-corrections">Updates and Corrections</h3>
    <p>`;
    if (frontMatter.githubCompareUpdatesUrl) {
      html += `<a href="${frontMatter.githubCompareUpdatesUrl}">View all changes</a> to this article since it was first published.`;
    }
    html += `
    If you see mistakes or want to suggest changes, please <a href="${frontMatter.githubUrl + '/issues/new'}">create an issue on GitHub</a>. </p>
    `;
  }

  const journal = frontMatter.journal;
  if (typeof journal !== 'undefined' && journal.title === 'Distill') {
    html += `
    <h3 id="reuse">Reuse</h3>
    <p>Diagrams and text are licensed under Creative Commons Attribution <a href="https://creativecommons.org/licenses/by/4.0/">CC-BY 4.0</a> with the <a class="github" href="${frontMatter.githubUrl}">source available on GitHub</a>, unless noted otherwise. The figures that have been reused from other sources don’t fall under this license and can be recognized by a note in their caption: “Figure from …”.</p>
    `;
  }

  if (typeof frontMatter.publishedDate !== 'undefined') {
    html += `
    <h3 id="citation">Citation</h3>
    <p>For attribution in academic contexts, please cite this work as</p>
    <pre class="citation short">${frontMatter.concatenatedAuthors}, "${frontMatter.title}", Distill, ${frontMatter.publishedYear}.</pre>
    <p>BibTeX citation</p>
    <pre class="citation long">${serializeFrontmatterToBibtex(frontMatter)}</pre>
    `;
  }

  return html;
}

class DistillAppendix extends HTMLElement {

  static get is() { return 'distill-appendix'; }

  set frontMatter(frontMatter) {
    this.innerHTML = appendixTemplate(frontMatter);
  }

}

const footerTemplate = `
<style>

:host {
  color: rgba(255, 255, 255, 0.5);
  font-weight: 300;
  padding: 2rem 0;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  background-color: hsl(180, 5%, 15%); /*hsl(200, 60%, 15%);*/
  text-align: left;
  contain: content;
}

.footer-container .logo svg {
  width: 24px;
  position: relative;
  top: 4px;
  margin-right: 2px;
}

.footer-container .logo svg path {
  fill: none;
  stroke: rgba(255, 255, 255, 0.8);
  stroke-width: 3px;
}

.footer-container .logo {
  font-size: 17px;
  font-weight: 200;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  margin-right: 6px;
}

.footer-container {
  grid-column: text;
}

.footer-container .nav {
  font-size: 0.9em;
  margin-top: 1.5em;
}

.footer-container .nav a {
  color: rgba(255, 255, 255, 0.8);
  margin-right: 6px;
  text-decoration: none;
}

</style>

<div class='footer-container'>

  <a href="/" class="logo">
    ${logo}
    Distill
  </a> is dedicated to clear explanations of machine learning

  <div class="nav">
    <a href="https://distill.pub/about/">About</a>
    <a href="https://distill.pub/journal/">Submit</a>
    <a href="https://distill.pub/prize/">Prize</a>
    <a href="https://distill.pub/archive/">Archive</a>
    <a href="https://distill.pub/rss.xml">RSS</a>
    <a href="https://github.com/distillpub">GitHub</a>
    <a href="https://twitter.com/distillpub">Twitter</a>
    &nbsp;&nbsp;&nbsp;&nbsp; ISSN 2476-0757
  </div>

</div>

`;

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const T$12 = Template('distill-footer', footerTemplate);

class DistillFooter extends T$12(HTMLElement) {

}

// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* Transforms */
/* Components */
/* Distill website specific components */
const distillMain = function() {

  if (window.distillRunlevel < 1) {
    throw new Error('Insufficient Runlevel for Distill Template!');
  }

  /* 1. Flag that we're being loaded */
  if ('distillTemplateIsLoading' in window && window.distillTemplateIsLoading) {
    throw new Error('Runlevel 1: Distill Template is getting loaded more than once, aborting!');
  } else {
    window.distillTemplateIsLoading = true;
    console.debug('Runlevel 1: Distill Template has started loading.');
  }

  /* 2. Add styles if they weren't added during prerendering */
  makeStyleTag(document);
  console.debug('Runlevel 1: Static Distill styles have been added.');
  console.debug('Runlevel 1->2.');
  window.distillRunlevel += 1;

  /* 3. Register Controller listener functions */
  /* Needs to happen before components to their connected callbacks have a controller to talk to. */
  for (const [functionName, callback] of Object.entries(Controller.listeners)) {
    if (typeof callback === 'function') {
      document.addEventListener(functionName, callback);
    } else {
      console.error('Runlevel 2: Controller listeners need to be functions!');
    }
  }
  console.debug('Runlevel 2: We can now listen to controller events.');
  console.debug('Runlevel 2->3.');
  window.distillRunlevel += 1;

  /* 4. Register components */
  const components = [
    Abstract, Appendix, Article, Bibliography, Byline, Cite, CitationList, Code,
    Footnote, FootnoteList, FrontMatter$1, HoverBox, Title, DMath, References, TOC, Figure,
    Slider, Interstitial
  ];

  const distillComponents = [
    DistillHeader, DistillAppendix, DistillFooter,
  ];

  if (window.distillRunlevel < 2) {
    throw new Error('Insufficient Runlevel for adding custom elements!');
  }
  const allComponents = components.concat(distillComponents);
  for (const component of allComponents) {
    console.debug('Runlevel 2: Registering custom element: ' + component.is);
    customElements.define(component.is, component);
  }

  console.debug('Runlevel 3: Distill Template finished registering custom elements.');
  console.debug('Runlevel 3->4.');
  window.distillRunlevel += 1;

  // If template was added after DOMContentLoaded we may have missed that event.
  // Controller will check for that case, so trigger the event explicitly:
  if (domContentLoaded()) {
    Controller.listeners.DOMContentLoaded();
  }

  console.debug('Runlevel 4: Distill Template initialisation complete.');
};

window.distillRunlevel = 0;
/* 0. Check browser feature support; synchronously polyfill if needed */
if (Polyfills.browserSupportsAllFeatures()) {
  console.debug('Runlevel 0: No need for polyfills.');
  console.debug('Runlevel 0->1.');
  window.distillRunlevel += 1;
  distillMain();
} else {
  console.debug('Runlevel 0: Distill Template is loading polyfills.');
  Polyfills.load(distillMain);
}

})));
//# sourceMappingURL=template.v2.js.map
