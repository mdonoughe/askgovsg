import { Spacer } from '@chakra-ui/react'
import React from 'react'
import { Redirect } from 'react-router-dom'
import AuthForm from '../../components/AuthForm/AuthForm.component'
import { useAuth } from '../../contexts/AuthContext'
import { TagType } from '~shared/types/base'
import './Login.styles.scss'

const Login = () => {
  const { user } = useAuth()

  if (user) {
    // if user is linked to multiple agencies via agencyTag
    // take the first agencyTag found as agency to redirect to after login
    const firstAgencyTagLinkedToUser = user.tags.find(
      (tag) => tag.tagType === TagType.Agency,
    )
    const agencyShortName = firstAgencyTagLinkedToUser.tagname //currently link agency tag to agency via tag.tagname to agency.shortname
    return <Redirect to={`/agency/${agencyShortName}`} />
  } else {
    return (
      <div className="login-page">
        <Spacer h={['64px', '64px', '84px']} />
        <h2>AskGov</h2>
        <p>Answers from the Singapore Government</p>
        <AuthForm />
        <Spacer minH={20} />
      </div>
    )
  }
}

export default Login
