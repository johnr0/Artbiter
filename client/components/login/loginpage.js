import React, {Component} from 'react'
import Api from '../../middleware/api';

class LoginPage extends Component{
    state={
        tosignup: false,
    }

    componentDidMount(){
        console.log(Api.app)
        Api.app.reAuthenticate().then(()=>{
            console.log('success..')
            window.location.href = '/boardlist'
          }).catch((err)=>{
            console.log('no..')
          })
        // Api.app.reAuthenticate().catch((err)=>{

        // })
    }

    toggleSignUp(){
        this.setState({tosignup: !this.state.tosignup})
    }

    localCreateAccount(){
        console.log(this.validateEmail(this.refs.email.value))
        if(this.refs.password.value==this.refs.password_retype.value && this.validateEmail(this.refs.email.value)){
            console.log('authenticating...')
            Api.createUser({
                    email: this.refs.email.value,
                    password: this.refs.password.value,
                })
        }else{
            alert('The passwords should match!')
        }
    
    }

    validateEmail(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    localLogIn(){
        if(this.validateEmail(this.refs.email.value)){
            console.log('authenticating...')
            Api.authenticate({
                    email: this.refs.email.value,
                    password: this.refs.password.value,
                })
        }
    }

    GoogleLogIn(){

    }

    render(){
        return (<div className="login">
            <h2>Artbiter</h2>
            <div className='row'>
                <input ref='email' type='email' placeholder='your email'></input>
            </div>

            <div className='row'>
                <input ref='password' type='password' placeholder='your password'></input>
            </div>

            {this.state.tosignup==true &&
                <div className='row'>
                    <input ref='password_retype' type='password' placeholder='retype password'></input>
                </div>
            } 

            {this.state.tosignup==false &&
            <div>
                <div className='row'>
                    <div className='btn' onClick={this.localLogIn.bind(this)} style={{marginRight:'10px'}}>Log in</div>
                    <div className='btn' onClick={this.toggleSignUp.bind(this)}>Sign Up</div>
                </div>

                <div className='row'>
                <div className='btn red'>Log in with Google</div>
                </div>
            </div>
            }

            {this.state.tosignup==true &&
            <div>
                <div className='row'>
                    <div className='btn' onClick={this.localCreateAccount.bind(this)}>Sign Up</div>
                    <div className='btn red' style={{marginLeft:'10px'}} onClick={this.toggleSignUp.bind(this)}>Cancel</div>
                    
                </div>
            </div>
            }       
        </div>)
    }
}

export default LoginPage;