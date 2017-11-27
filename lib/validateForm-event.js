module.exports = function asyncErrorCatcher(form, options) {


  // 나중에 시간되면 ㄱ



   // async error handling 필요
  var name = form.name || "";
  var email = form.email || "";
  name = name.trim();
  email = email.trim();

  console.log("!!req!! :",options.req);
  console.log("!!req!! :",options.user);
  if (!name) {
    return 'Name is required.';
  }

  if (!email) {
    return 'Email is required.';
  }
  if (options.updateUser && !options.checkCurrenUser) {
    if (!form.current_password) {
      return 'Current password is required.';
    }
    return 'Current password is wrong';
  }

  if (!form.password && options.needPassword) {
    return 'Password is required.';
  }

  if (form.password !== form.password_confirmation) {
    return 'Passsword do not match.';
  }

  if (form.password.length < 6) {
    return 'Password must be at least 6 characters.';
  }

  return null;
};