import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

// Edge Function URL
const EDGE_FUNCTION_URL = 'https://loyzwjzsjnikmnuqilmv.functions.supabase.co/access-manager';

interface RequestAccessProps {
  onAccessGranted: () => void;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
`;

const OfflineIndicator = styled.div<{ isOffline: boolean }>`
  position: fixed;
  top: 10px;
  right: 10px;
  padding: 8px 16px;
  border-radius: 4px;
  background-color: ${props => props.isOffline ? '#ff4444' : '#44b700'};
  color: white;
  font-size: 14px;
  opacity: ${props => props.isOffline ? 1 : 0};
  transition: opacity 0.3s ease-in-out;
  z-index: 1000;
`;

const LoadingContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  background: rgba(255, 255, 255, 0.9);
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  font-size: 16px;
  color: #333;
  text-align: center;
`;

const Form = styled.form`
  background: rgba(255, 255, 255, 0.9);
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const Title = styled.h1`
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #3498db;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #2980b9;
  }

  &:disabled {
    background: #bdc3c7;
    cursor: not-allowed;
  }
`;

const CodeDisplay = styled.div`
  background: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  width: 100%;
  max-width: 400px;
`;

const CodeText = styled.p`
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
`;

const StatusText = styled.p`
  font-size: 16px;
  color: #666;
  margin: 5px 0;
`;

const InstructionButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 24px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  
  &:hover {
    background: #2980b9;
  }
`;

const Modal = styled.div<{ isOpen: boolean }>`
  display: ${props => props.isOpen ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 30px;
  border-radius: 10px;
  max-width: 500px;
  width: 90%;
`;

const InstructionList = styled.ol`
  margin: 20px 0;
  padding-left: 20px;
`;

const InstructionItem = styled.li`
  margin: 10px 0;
  line-height: 1.5;
`;

const ExpiryNote = styled.p`
  color: #e74c3c;
  font-weight: bold;
  margin-top: 15px;
`;

const CloseButton = styled.button`
  float: right;
  padding: 8px 16px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  
  &:hover {
    background: #c0392b;
  }
`;

// დავამატოთ ახალი styled კომპონენტი ფეისბუქის ლინკისთვის
const FacebookLink = styled.a`
  display: block;
  margin-top: 20px;
  color: #3b5998;
  text-decoration: none;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

const RequestAccess: React.FC<RequestAccessProps> = ({ onAccessGranted }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [requestCode, setRequestCode] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ვამოწმებთ ოფლაინ წვდომას
  const checkOfflineAccess = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    const wasEverApproved = localStorage.getItem('wasEverApproved') === 'true';
    const lastStatusCheck = localStorage.getItem('statusTimestamp');
    
    if (!wasEverApproved || !lastStatusCheck) return false;
    
    const lastCheckTime = parseInt(lastStatusCheck);
    const now = Date.now();
    const MAX_OFFLINE_TIME = 24 * 60 * 60 * 1000; // 24 საათი
    
    return now - lastCheckTime < MAX_OFFLINE_TIME;
  }, []);

  // ონლაინ სტატუსის მონიტორინგი
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      checkExistingStatus();
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (checkOfflineAccess()) {
        onAccessGranted();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // თავიდანვე ვამოწმებთ ოფლაინ წვდომას
    if (!window.navigator.onLine && checkOfflineAccess()) {
      onAccessGranted();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onAccessGranted, checkOfflineAccess]);

  useEffect(() => {
    const savedCode = localStorage.getItem('lastRequestCode');
    const savedFirstName = localStorage.getItem('firstName');
    const savedLastName = localStorage.getItem('lastName');
    if (savedCode) {
      setRequestCode(savedCode);
      setFirstName(savedFirstName || '');
      setLastName(savedLastName || '');
    }
  }, []);

  const checkExistingStatus = async () => {
    const userCode = localStorage.getItem('userCode');
    if (!userCode) return;

    try {
      const response = await fetch(`${EDGE_FUNCTION_URL}/status?code=${userCode}&isActive=${!document.hidden}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.status === 429) return;

      const data = await response.json();
      
      if (data.status === 'approved') {
        localStorage.setItem('approvalStatus', 'approved');
        localStorage.setItem('statusTimestamp', Date.now().toString());
        localStorage.setItem('wasEverApproved', 'true');
        navigate('/', { replace: true });
      } else if (data.status === 'blocked') {
        // თუ დაბლოკილია, ვშლით ყველა ლოკალურ მონაცემს
        localStorage.removeItem('userCode');
        localStorage.removeItem('approvalStatus');
        localStorage.removeItem('statusTimestamp');
        localStorage.removeItem('wasEverApproved');
        toast.error('თქვენი წვდომა დაბლოკილია', {
          position: "top-center",
          autoClose: 3000
        });
      }
    } catch (err) {
      console.error('Error checking status:', err);
      // თუ ოფლაინ ვართ და გვაქვს წვდომა, ვაგრძელებთ მუშაობას
      if (!navigator.onLine && checkOfflineAccess()) {
        onAccessGranted();
      }
    }
  };

  useEffect(() => {
    // ვამოწმებთ სტატუსს როცა კომპონენტი ჩაიტვირთება
    checkExistingStatus();

    // ვამოწმებთ სტატუსს როცა ონლაინ ვხდებით
    const handleOnline = () => {
      checkExistingStatus();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [navigate]);

  useEffect(() => {
    if (!requestCode) return;

    const checkStatus = async () => {
      try {
        const response = await fetch(
          `${EDGE_FUNCTION_URL}/status?code=${requestCode}&isActive=true`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          }
        );

        if (response.status === 429) return;

        const data = await response.json();

        if (!response.ok) throw new Error(data.error);

        if (data.status === 'approved') {
          localStorage.setItem('approvalStatus', 'approved');
          localStorage.setItem('userCode', requestCode);
          localStorage.setItem('statusTimestamp', Date.now().toString());
          localStorage.setItem('wasEverApproved', 'true');
          onAccessGranted();
        } else if (data.status === 'blocked') {
          localStorage.removeItem('lastRequestCode');
          localStorage.removeItem('firstName');
          localStorage.removeItem('lastName');
          localStorage.removeItem('userCode');
          localStorage.removeItem('approvalStatus');
          localStorage.removeItem('statusTimestamp');
          localStorage.removeItem('wasEverApproved');
          setRequestCode(null);
          setFirstName('');
          setLastName('');
          toast.error('თქვენი წვდომა დაბლოკილია. გთხოვთ დაელოდოთ ადმინისტრატორის პასუხს.');
        }
      } catch (err) {
        console.error('Error checking status:', err);
      }
    };
    
    // მხოლოდ ერთხელ შევამოწმოთ სტატუსი კომპონენტის ჩატვირთვისას
    checkStatus();
    
  }, [requestCode, onAccessGranted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      toast.error('გთხოვთ შეავსოთ სახელი და გვარი', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${EDGE_FUNCTION_URL}/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || 'მოთხოვნის გაგზავნა ვერ მოხერხდა', {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        });
        return;
      }

      localStorage.setItem('lastRequestCode', data.code);
      localStorage.setItem('firstName', firstName);
      localStorage.setItem('lastName', lastName);
      setRequestCode(data.code);
      
      toast.success('მოთხოვნა წარმატებით გაიგზავნა', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    } catch (err: any) {
      toast.error('მოთხოვნის გაგზავნა ვერ მოხერხდა', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <OfflineIndicator isOffline={!isOnline}>
        ხაზგარეშე რეჟიმი
      </OfflineIndicator>
      {!requestCode ? (
        <Form onSubmit={handleSubmit}>
          <Title>მოთხოვნის გაგზავნა</Title>
          <Input
            type="text"
            placeholder="ტრანზაქციის ავტორის სახელი"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <Input
            type="text"
            placeholder="ტრანზაქციის ავტორის გვარი"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'იგზავნება...' : 'გაგზავნა'}
          </Button>
        </Form>
      ) : (
        <>
          {localStorage.getItem('approvalStatus') === 'approved' ? (
            <LoadingContainer>
              <Spinner />
              <LoadingText>სტატუსი მოწმდება...</LoadingText>
            </LoadingContainer>
          ) : (
            <CodeDisplay>
              <CodeText>{requestCode}</CodeText>
              <StatusText>
                თქვენი კოდი: {requestCode}
              </StatusText>
              <StatusText>
                გთხოვთ დაელოდოთ ადმინისტრატორის დადასტურებას
              </StatusText>
            </CodeDisplay>
          )}
        </>
      )}
      <InstructionButton onClick={() => setIsModalOpen(true)}>
        ინსტრუქცია
      </InstructionButton>

      <Modal isOpen={isModalOpen} onClick={() => setIsModalOpen(false)}>
        <ModalContent onClick={e => e.stopPropagation()}>
          <CloseButton onClick={() => setIsModalOpen(false)}>X</CloseButton>
          <h2>შესვლის ინსტრუქცია</h2>
          <InstructionList>
            <InstructionItem>
             შეასრულეთ ტრანზაქცია: 5167460431565880
            </InstructionItem>
            <InstructionItem>
              შეიყვანეთ ტრანზაქციის ავტორის სახელი და გვარი
            </InstructionItem>
            <InstructionItem>
              დააჭირეთ გამოგზავნას
            </InstructionItem>
          </InstructionList>
          <p>
            ამ ყველაფრის შემდეგ ადმინისტრატორი დაგიდასტურებთ მოთხოვნას და 
            გადამისამართდებით მთავარ გვერდზე
          </p>
          <ExpiryNote>
            1 წლის განმავლობაში
          </ExpiryNote>
          <FacebookLink 
            href="https://www.facebook.com/profile.php?id=61567812722184"
            target="_blank"
            rel="noopener noreferrer"
          >
            დამატებითი ინფორმაციისთვის ეწვიეთ ჩვენს ფეისბუქ ჯგუფს
          </FacebookLink>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default RequestAccess;
