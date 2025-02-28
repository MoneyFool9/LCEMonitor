export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['build', 'chore', 'ci', 'docs', 'feat', 'fix', 'perf', 'refactor', 'revert', 'style', 'test']
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'scope-case': [2, 'always', 'lower-case'],
    // 'scope-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'header-max-length': [2, 'always', 72]
  }
}
/**
 * type-enum: 提交类型必须是预定义的值之一。
    type-case: 提交类型必须是小写。
    type-empty: 提交类型不能为空。
    scope-case: 作用域必须是小写。
    subject-full-stop: 提交说明末尾不能有句号。
    subject-case: 提交说明不能是句子开头大写或其他特定情况。
    header-max-length: 提交信息的长度不能超过72个字符。
*/
