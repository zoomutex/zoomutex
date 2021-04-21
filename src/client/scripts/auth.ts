const host = "https://authentication0service.herokuapp.com"
const loginEndpoint = `${host}/signin`
const signUpEndpoint = `${host}/signup`

const postJsonRequest = (url: string, body: any) => {
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
}

async function signUpUser(userDetails: any) : Promise<boolean>{
    const x = await postJsonRequest(signUpEndpoint, userDetails)
    if (x.status == 200){
        return true
    } else {
        return false
    }
}
async function loginUser(userDetails: any) : Promise<boolean>{
    const x = await postJsonRequest(loginEndpoint, userDetails)
    if (x.status == 200){
        return true
    } else {
        return false
    }
}