import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LoginRequest, AuthResponse } from '../../shared/models';

describe('AuthService', () => {
    let service: AuthService;
    let httpMock: HttpTestingController;
    let routerSpy: jasmine.SpyObj<Router>;
    const API_URL = `${environment.apiUrl}/auth`;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('Router', ['navigate']);
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                AuthService,
                { provide: Router, useValue: spy }
            ]
        });
        service = TestBed.inject(AuthService);
        httpMock = TestBed.inject(HttpTestingController);
        routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        localStorage.clear();
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should login successfully and store tokens', () => {
        const mockRequest: LoginRequest = { email: 'test@test.com', password: 'password' };
        const mockResponse: AuthResponse = {
            token: 'access-token',
            refreshToken: 'refresh-token',
            type: 'Bearer',
            email: 'test@test.com'
        };

        service.login(mockRequest).subscribe(response => {
            expect(response).toEqual(mockResponse);
            expect(localStorage.getItem('teamflow_token')).toBe('access-token');
            expect(localStorage.getItem('teamflow_refresh_token')).toBe('refresh-token');
        });

        const req = httpMock.expectOne(`${API_URL}/login`);
        expect(req.request.method).toBe('POST');
        req.flush(mockResponse);
    });

    it('should logout and clear session', () => {
        localStorage.setItem('teamflow_token', 'some-token');

        service.logout();

        const req = httpMock.expectOne(`${API_URL}/logout`);
        expect(req.request.method).toBe('POST');
        req.flush({});

        expect(localStorage.getItem('teamflow_token')).toBeNull();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should return true for isAuthenticated when token exists', () => {
        // Generate a mock JWT that is not expired
        const payload = { exp: Math.floor(Date.now() / 1000) + 3600 };
        const token = `header.${btoa(JSON.stringify(payload))}.signature`;
        localStorage.setItem('teamflow_token', token);

        expect(service.isAuthenticated()).toBeTrue();
    });

    it('should return false for isTokenExpired correctly (mocked)', () => {
        const expiredPayload = { exp: Math.floor(Date.now() / 1000) - 3600 };
        const token = `header.${btoa(JSON.stringify(expiredPayload))}.signature`;
        localStorage.setItem('teamflow_token', token);

        expect(service.isAuthenticated()).toBeFalse();
        expect(localStorage.getItem('teamflow_token')).toBeNull();
    });
});
