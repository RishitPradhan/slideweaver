
import { subscribeToHellfireClub } from "./firebase/hellfire-club.js"




const txtName = document.getElementById('txtName')
const txtEmail   = document.getElementById('txtEmail')
const txtLevel  = document.getElementById('txtLevel')
const txtCharacter = document.getElementById('txtCharacter')

const bntSubscribe = document.getElementById('bntSubscribe')

bntSubscribe.addEventListener('click', async () => {  /* Essa abreviação significa "função, faça isso" */
    const subscription = {
        name: txtName.value,
        email: txtEmail.value,
        level: txtLevel.value,
        character: txtCharacter.value
    }

    // salvar no banco de dados //
    const subscriptionId = await subscribeToHellfireClub(subscription)
    console.log('Successfully Joined the AV Club: ${subscriptionId}')

    txtName.value = ""
    txtEmail.value = ""
    txtLevel.value = ""
    txtCharacter.value = ""

    alert('Successfully Joined the AV Club!!! Ready for Project Directive 3.')
})