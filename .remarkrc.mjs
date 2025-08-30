import remarkValidateLinks from 'remark-validate-links';

export default {
  plugins: [[remarkValidateLinks, {repository: false}]]
};
