import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
    let httpMock: HttpTestingController;
    let httpClient: HttpClient;
    let authServiceSpy: jasmine.SpyObj<AuthService>;

    beforeEach(() => {
        authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken']);

        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([authInterceptor])),
                provideHttpClientTesting(),
                { provide: AuthService, useValue: authServiceSpy }
            ]
        });

        httpMock = TestBed.inject(HttpTestingController);
        httpClient = TestBed.inject(HttpClient);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should add Authorization header when token exists', () => {
        authServiceSpy.getToken.and.returnValue('test-token');

        httpClient.get('/api/test').subscribe();

        const req = httpMock.expectOne('/api/test');
        expect(req.request.headers.has('Authorization')).toBeTrue();
        expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
        req.flush({});
    });

    it('should not add Authorization header when token does not exist', () => {
        authServiceSpy.getToken.and.returnValue(null);

        httpClient.get('/api/test').subscribe();

        const req = httpMock.expectOne('/api/test');
        expect(req.request.headers.has('Authorization')).toBeFalse();
        req.flush({});
    });
});
