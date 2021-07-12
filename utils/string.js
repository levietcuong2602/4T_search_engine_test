function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, 'g'), replace);
}

function punctuatify(string) {
  return string.replace(/[^A-Za-z0-9\s]/g, '').replace(/\s{2,}/g, ' ');
}

function slugify(string) {
  return string
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
    .replace(
      /`|~|!|@|#|\||\$|%|\^|&|\*|\(|\)|\+|=|,|\.|\/|\?|>|<|'|"|:|;|_/gi,
      '',
    )
    .replace(/@-|-@|@/gi, '');
}

function nonAccentVietnamese(string) {
  return (
    string
      .toLowerCase()
      .replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a')
      .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e')
      .replace(/ì|í|ị|ỉ|ĩ/g, 'i')
      .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o')
      .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u')
      .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y')
      .replace(/đ/g, 'd')
      // Some system encode vietnamese combining accent as individual utf-8 characters
      .replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, '') // Huyền sắc hỏi ngã nặng
      .replace(/\u02C6|\u0306|\u031B/g, '') // Â, Ê, Ă, Ơ, Ư
  );
}

function slugifyVietnamese(string) {
  return slugify(punctuatify(nonAccentVietnamese(string)));
}

function mergeText({ contactData, content }) {
  const regex = /@\b[\w\d]+/;
  while (content.match(regex) !== null) {
    const regexResult = content.match(regex);
    const key = regexResult[0].replace('@', '');
    let value = '';
    if (contactData[key]) {
      value = contactData[key];
    }
    content = content.replace(`@${key}`, value);
  }
  return content;
}

function normalizeString(string) {
  return string
    .replace(/-+/gi, '-')
    .replace(/@-|-@|@/gi, '')
    .replace(/````/gi, '')
    .replace(/```/, '')
    .trim();
}

module.exports = {
  replaceAll,
  punctuatify,
  slugify,
  nonAccentVietnamese,
  slugifyVietnamese,
  mergeText,
  normalizeString,
};
