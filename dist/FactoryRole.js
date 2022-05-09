function roleFactory(role) {
    const { name, run } = role

    ROLES[name] = run

    return role
}



module.exports = roleFactory