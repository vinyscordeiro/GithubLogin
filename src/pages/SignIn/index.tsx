/* eslint-disable react-native/no-inline-styles */
import React, {useState, useCallback, useEffect, useRef} from 'react';
import {Alert, Switch, KeyboardAvoidingView, ScrollView} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

import {useNavigation} from '@react-navigation/native';
import {FormHandles} from '@unform/core';
import {Form} from '@unform/mobile';
import * as Yup from 'yup';

import {useAuth} from '../../hooks/Context/AuthContext';
import Button from '../../components/Button';
import Input from '../../components/Input';

import {
  Container,
  Title,
  Subtitle,
  SignUpTitle,
  SignUpTitleBold,
  FingerprintView,
  FingerprintText,
  CenteredView,
} from './styles';
import AsyncStorage from '@react-native-community/async-storage';

interface signInFormData {
  email: string;
  password: string;
}

const SignIn: React.FC = () => {
  const navigation = useNavigation();
  const formRef = useRef<FormHandles>(null);

  const {signInForm, signInBiometry} = useAuth();

  const [biometryAvailable, setBiometryAvailable] = useState(false);
  const [biometryData, setBiometryData] = useState(false);
  const [biometryActive, setbiometryActive] = useState(false);
  const [biometryEnabled, setBiometryEnabled] = useState(false);

  const handleSignInForm = useCallback(
    async (data: signInFormData): Promise<void> => {
      try {
        const schema = Yup.object().shape({
          email: Yup.string()
            .required('Email obrigatório')
            .email('Digite um email válido'),
          password: Yup.string().required('Senha obrigatória'),
        });

        await schema.validate(data, {abortEarly: false});

        await signInForm({
          email: data.email,
          password: data.password,
          biometry: biometryActive,
        });
      } catch (err) {
        if (err instanceof Yup.ValidationError) {
          Alert.alert('Erro no preenchimento', err.message);
        } else {
          Alert.alert(
            'Erro ao fazer login',
            'Verifique seus dados e tente novamente',
          );
        }
      }
    },
    [biometryActive, signInForm],
  );

  const handleSignInBiometry = useCallback(async () => {
    const {success} = await LocalAuthentication.authenticateAsync({
      cancelLabel: 'Cancelar',
    });
    if (success) {
      signInBiometry();
    }
  }, [signInBiometry]);

  const toggleSwitch = useCallback(async () => {
    const available = await LocalAuthentication.hasHardwareAsync();
    if (available) {
      setbiometryActive((previousState) => !previousState);
    } else {
      Alert.alert(
        'Biometria não disponível',
        'Dispositivo não possui biometria disponível',
      );
    }
  }, []);

  const navigateToSignUp = useCallback(() => {
    navigation.navigate('SignUp');
  }, [navigation]);

  useEffect(() => {
    async function haveAvailableBiometry() {
      const response = await LocalAuthentication.hasHardwareAsync();
      setBiometryAvailable(response);
    }
    async function haveAvailableBiometryData() {
      const response = await LocalAuthentication.isEnrolledAsync();
      setBiometryData(response);
    }
    async function haveBiometryEnabled() {
      const response = await AsyncStorage.getItem('@DevLogin:biometry');
      if (!response) {
        Alert.alert('Não há resposta');
      }
      if (response) {
        setBiometryEnabled(JSON.parse(response));
      }
    }

    haveAvailableBiometry();
    haveAvailableBiometryData();
    haveBiometryEnabled();

    if (
      biometryAvailable === true &&
      biometryData === true &&
      biometryEnabled === true
    ) {
      handleSignInBiometry();
    }
  }, [biometryAvailable, biometryData, biometryEnabled, handleSignInBiometry]);

  return (
    <>
      <Container>
        <Title>Faça seu Login</Title>
        <Subtitle>Bem-vindo de volta, és bué importante para nós!</Subtitle>
        <KeyboardAvoidingView style={{flex: 1}} enabled>
          <ScrollView>
            <Form ref={formRef} onSubmit={handleSignInForm}>
              <Input
                name="email"
                autoCapitalize="none"
                icon="user"
                title="Email"
              />
              <Input
                name="password"
                autoCompleteType="off"
                icon="lock"
                title="Senha"
                secret={true}
              />

              {biometryAvailable && (
                <FingerprintView>
                  <Switch
                    trackColor={{false: '#767577', true: '#5ec22e'}}
                    thumbColor={'#f4f3f4'}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={toggleSwitch}
                    value={biometryActive}
                  />
                  <FingerprintText>Ativar uso da biometria</FingerprintText>
                </FingerprintView>
              )}

              <CenteredView>
                <Button
                  title="ENTRAR"
                  onPress={() => {
                    formRef.current?.submitForm();
                  }}
                />
                <SignUpTitle onPress={navigateToSignUp}>
                  Não tem conta ainda?
                </SignUpTitle>
                <SignUpTitleBold onPress={navigateToSignUp}>
                  Cadastre-se
                </SignUpTitleBold>
              </CenteredView>
            </Form>
          </ScrollView>
        </KeyboardAvoidingView>
      </Container>
    </>
  );
};

export default SignIn;
