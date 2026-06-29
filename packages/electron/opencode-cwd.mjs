export const resolveManagedOpenCodeCwd = ({ env, homedir }) => {
  const configured = typeof env?.OPENJUNIOR_OPENCODE_CWD === 'string'
    ? env.OPENJUNIOR_OPENCODE_CWD.trim()
    : '';
  if (configured) {
    return configured;
  }

  const home = typeof homedir === 'function' ? homedir() : '';
  return typeof home === 'string' && home.trim() ? home : process.cwd();
};
